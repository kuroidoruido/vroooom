use std::sync::Arc;

use axum::{Json, Router, extract::State, routing::post};

use crate::error::{AppError, AppResult};
use crate::models::{LoginRequest, LoginResponse, RegisterRequest, RegisterResponse};
use crate::storage::Storage;

pub fn router(feature_account_creation: bool) -> Router<Arc<Storage>> {
    Router::new()
        .route("/api/auth/register", post(register))
        .route("/api/auth/login", post(login))
        .layer(axum::extract::Extension(feature_account_creation))
}

async fn register(
    State(storage): State<Arc<Storage>>,
    axum::extract::Extension(feature_account_creation): axum::extract::Extension<bool>,
    Json(req): Json<RegisterRequest>,
) -> AppResult<Json<RegisterResponse>> {
    if !feature_account_creation {
        return Err(AppError::Internal(
            "Account creation is disabled".to_string(),
        ));
    }

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
