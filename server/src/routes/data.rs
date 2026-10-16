use std::sync::Arc;

use axum::{
    extract::{Path, State},
    routing::{get, put},
    Json, Router,
};

use crate::error::AppResult;
use crate::models::{BlobListResponse, BlobResponse, StoreBlobRequest};
use crate::storage::Storage;

pub fn router() -> Router<Arc<Storage>> {
    Router::new()
        .route("/api/data", get(list_blobs))
        .route("/api/data/{blob_id}", get(get_blob))
        .route("/api/data/{blob_id}", put(store_blob))
}

async fn list_blobs(
    State(storage): State<Arc<Storage>>,
) -> AppResult<Json<BlobListResponse>> {
    // TODO: Get username from auth token/session
    let username = "default"; // Placeholder
    let blobs = storage.list_blobs(username).await?;
    Ok(Json(BlobListResponse { blobs }))
}

async fn get_blob(
    State(storage): State<Arc<Storage>>,
    Path(blob_id): Path<String>,
) -> AppResult<Json<BlobResponse>> {
    // TODO: Get username from auth token/session
    let username = "default"; // Placeholder
    let data = storage.get_blob(username, &blob_id).await?;
    Ok(Json(BlobResponse { data }))
}

async fn store_blob(
    State(storage): State<Arc<Storage>>,
    Path(blob_id): Path<String>,
    Json(req): Json<StoreBlobRequest>,
) -> AppResult<axum::http::StatusCode> {
    // TODO: Get username from auth token/session
    let username = "default"; // Placeholder
    storage.store_blob(username, &blob_id, &req.data).await?;
    Ok(axum::http::StatusCode::CREATED)
}
