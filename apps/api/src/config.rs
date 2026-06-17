pub struct Config {
    pub database_url: String,
    pub lore_server_url: String,
    pub lore_jwt_secret: String,
    pub lore_jwt_issuer: String,
    pub port: u16,
}

impl Config {
    pub fn from_env() -> Self {
        Self {
            database_url: std::env::var("DATABASE_URL").unwrap_or_else(|_| {
                "postgres://postgres:postgres@localhost:5432/lorehub".to_owned()
            }),
            lore_server_url: std::env::var("LORE_SERVER_URL")
                .unwrap_or_else(|_| "http://localhost:8081".to_owned()),
            lore_jwt_secret: std::env::var("LORE_JWT_SECRET")
                .unwrap_or_else(|_| "local-development-secret-change-me".to_owned()),
            lore_jwt_issuer: std::env::var("LORE_JWT_ISSUER")
                .unwrap_or_else(|_| "lorehub-api".to_owned()),
            port: std::env::var("PORT")
                .ok()
                .and_then(|value| value.parse().ok())
                .unwrap_or(8080),
        }
    }
}
