use std::sync::Arc;

use axum::{extract::State, routing::get, Json, Router};

use crate::error::AppResult;
use crate::storage::Storage;

pub fn router() -> Router<Arc<Storage>> {
    Router::new().route("/api/sync", get(sync))
}

async fn sync(
    State(_storage): State<Arc<Storage>>,
) -> AppResult<Json<serde_json::Value>> {
    // TODO: Implement incremental sync
    Ok(Json(serde_json::json!({
        "blobs": [],
        "profileEvents": []
    })))
}
