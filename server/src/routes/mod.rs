pub mod auth;
pub mod data;
pub mod sync;

use axum::{routing::get, Router};
use std::sync::Arc;

use crate::models::HealthResponse;
use crate::storage::Storage;

pub fn health_router() -> Router<Arc<Storage>> {
    Router::new().route("/api/health", get(health))
}

async fn health() -> axum::Json<HealthResponse> {
    axum::Json(HealthResponse {
        status: "ok".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
    })
}
