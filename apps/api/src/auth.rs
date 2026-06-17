use chrono::Utc;
use db_types::{LoreAccessTokenClaims, Permission, Repository};
use jsonwebtoken::{encode, EncodingKey, Header};

use crate::error::AppError;

#[derive(Clone)]
pub struct TokenIssuer {
    encoding_key: EncodingKey,
    issuer: String,
}

impl TokenIssuer {
    pub fn new(secret: String, issuer: String) -> Self {
        Self {
            encoding_key: EncodingKey::from_secret(secret.as_bytes()),
            issuer,
        }
    }

    pub fn issue_repository_token(
        &self,
        repository: &Repository,
        permission: Permission,
        ttl_seconds: u64,
        subject: String,
    ) -> Result<String, AppError> {
        let ttl_seconds = ttl_seconds.clamp(60, 15 * 60);
        let issued_at = Utc::now().timestamp().max(0) as usize;
        let claims = LoreAccessTokenClaims {
            sub: subject,
            iss: self.issuer.clone(),
            iat: issued_at,
            exp: issued_at + ttl_seconds as usize,
            partition_id: hex::encode(&repository.lore_partition_id),
            permission,
        };

        encode(&Header::default(), &claims, &self.encoding_key)
            .map_err(|error| AppError::internal(error.to_string()))
    }
}

#[cfg(test)]
mod tests {
    use chrono::Utc;
    use db_types::{Permission, Repository};
    use jsonwebtoken::{decode, DecodingKey, Validation};
    use uuid::Uuid;

    use super::TokenIssuer;

    #[test]
    fn issues_partition_scoped_token() {
        let issuer = TokenIssuer::new("secret".into(), "lorehub-api".into());
        let repository = Repository {
            id: Uuid::new_v4(),
            org_id: None,
            name: "demo".into(),
            display_name: "Demo".into(),
            description: None,
            visibility: "private".into(),
            lore_partition_id: vec![42; 16],
            default_branch: "main".into(),
            archived: false,
            created_at: Utc::now(),
        };

        let token = issuer
            .issue_repository_token(&repository, Permission::Write, 900, "test-user".into())
            .expect("token should encode");

        let decoded = decode::<db_types::LoreAccessTokenClaims>(
            &token,
            &DecodingKey::from_secret("secret".as_bytes()),
            &Validation::default(),
        )
        .expect("token should decode");

        assert_eq!(decoded.claims.partition_id, hex::encode([42; 16]));
        assert_eq!(decoded.claims.permission, Permission::Write);
        assert_eq!(decoded.claims.sub, "test-user");
    }
}
