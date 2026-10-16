use std::sync::Arc;

use axum::{
    extract::State,
    routing::post,
    Json, Router,
};

use crate::error::AppResult;
use crate::models::{LoginRequest, LoginResponse, RegisterRequest, RegisterResponse};
use crate::storage::Storage;

pub fn router() -> Router<Arc<Storage>> {
    Router::new()
        .route("/api/auth/register", post(register))
        .route("/api/auth/login", post(login))
}

async fn register(
    State(storage): State<Arc<Storage>>,
    Json(req): Json<RegisterRequest>,
) -> AppResult<Json<RegisterResponse>> {
    // TODO: Check FEATURE_ACCOUNT_CREATION flag
    storage
        .store_auth(&req.username, &req.salt, &req.auth_hash)
        .await?;

    Ok(Json(RegisterResponse {
        user_id: req.username,
    }))
}

async fn login(
    State(storage): State<Arc<Storage>>,
    Json(req): Json<LoginRequest>,
) -> AppResult<Json<LoginResponse>> {
    let (salt, auth_hash) = storage.get_auth(&req.username).await?;

    Ok(Json(LoginResponse { salt, auth_hash }))
}
