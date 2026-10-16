use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct RegisterRequest {
    pub username: String,
    pub salt: String,
    pub auth_hash: String,
}

#[derive(Debug, Serialize)]
pub struct RegisterResponse {
    pub user_id: String,
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub username: String,
}

#[derive(Debug, Serialize)]
pub struct LoginResponse {
    pub salt: String,
    pub auth_hash: String,
}

#[derive(Debug, Deserialize)]
pub struct StoreBlobRequest {
    pub data: String,
}

#[derive(Debug, Serialize)]
pub struct BlobListResponse {
    pub blobs: Vec<String>,
}

#[derive(Debug, Serialize)]
pub struct BlobResponse {
    pub data: String,
}

#[derive(Debug, Serialize)]
pub struct HealthResponse {
    pub status: String,
    pub version: String,
}
