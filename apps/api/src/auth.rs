use argon2::password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString};
use argon2::Argon2;
use axum::extract::FromRequestParts;
use axum::http::request::Parts;
use axum_extra::extract::CookieJar;
use chrono::Utc;
use db_types::{LoreAccessTokenClaims, Permission, Repository, User};
use jsonwebtoken::{encode, EncodingKey, Header};
use rand::RngCore;
use sha2::{Digest, Sha256};

use crate::{error::AppError, AppState};

/// Cookie name carrying the opaque session token.
pub const SESSION_COOKIE: &str = "lorehub_session";

/// Hash a plaintext password with Argon2id for storage.
pub fn hash_password(password: &str) -> Result<String, AppError> {
    let salt = SaltString::generate(&mut OsRng);
    Argon2::default()
        .hash_password(password.as_bytes(), &salt)
        .map(|hash| hash.to_string())
        .map_err(|error| AppError::internal(error.to_string()))
}

/// Verify a plaintext password against a stored Argon2 hash.
pub fn verify_password(password: &str, stored_hash: &str) -> bool {
    PasswordHash::new(stored_hash)
        .map(|parsed| {
            Argon2::default()
                .verify_password(password.as_bytes(), &parsed)
                .is_ok()
        })
        .unwrap_or(false)
}

/// Generate a fresh opaque session token (handed to the client).
pub fn generate_session_token() -> String {
    let mut bytes = [0u8; 32];
    rand::thread_rng().fill_bytes(&mut bytes);
    hex::encode(bytes)
}

/// Hash an opaque token (session or API token) for at-rest storage.
pub fn hash_token(token: &str) -> String {
    hex::encode(Sha256::digest(token.as_bytes()))
}

/// Extractor that resolves the authenticated user from the session cookie.
pub struct CurrentUser(pub User);

impl FromRequestParts<AppState> for CurrentUser {
    type Rejection = AppError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        let jar = CookieJar::from_headers(&parts.headers);
        let token = jar
            .get(SESSION_COOKIE)
            .map(|cookie| cookie.value().to_owned())
            .ok_or_else(|| AppError::unauthorized("authentication required"))?;

        let token_hash = hash_token(&token);
        let user = sqlx::query_as::<_, User>(
            r#"
            SELECT u.id, u.email, u.username, u.display_name, u.title, u.avatar_initials, u.created_at
            FROM sessions s
            JOIN users u ON u.id = s.user_id
            WHERE s.token_hash = $1 AND s.expires_at > now()
            "#,
        )
        .bind(token_hash)
        .fetch_optional(&state.pool)
        .await?
        .ok_or_else(|| AppError::unauthorized("session expired or invalid"))?;

        Ok(CurrentUser(user))
    }
}

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

    use super::{generate_session_token, hash_password, hash_token, verify_password, TokenIssuer};

    #[test]
    fn hashes_and_verifies_passwords() {
        let hash = hash_password("correct-horse-battery").expect("hash should succeed");
        assert!(verify_password("correct-horse-battery", &hash));
        assert!(!verify_password("wrong-password", &hash));
        // Argon2 hashes are salted, so the encoded form must not equal the input.
        assert_ne!(hash, "correct-horse-battery");
    }

    #[test]
    fn session_tokens_are_random_and_hash_stably() {
        let a = generate_session_token();
        let b = generate_session_token();
        assert_ne!(a, b);
        assert_eq!(a.len(), 64); // 32 bytes hex-encoded
        assert_eq!(hash_token(&a), hash_token(&a));
        assert_ne!(hash_token(&a), hash_token(&b));
    }

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
