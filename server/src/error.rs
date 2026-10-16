use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("user not found: {0}")]
    UserNotFound(String),

    #[error("blob not found: {0}")]
    BlobNotFound(String),

    #[error("invalid path: {0}")]
    InvalidPath(String),

    #[error("storage error: {0}")]
    Storage(#[from] std::io::Error),

    #[error("internal error: {0}")]
    Internal(String),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = match &self {
            AppError::UserNotFound(_) | AppError::BlobNotFound(_) => {
                (StatusCode::NOT_FOUND, self.to_string())
            }
            AppError::InvalidPath(_) => (StatusCode::BAD_REQUEST, self.to_string()),
            AppError::Storage(_) | AppError::Internal(_) => {
                (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error".to_string())
            }
        };

        tracing::error!(error = %self, "Request failed");

        (status, Json(json!({ "error": message }))).into_response()
    }
}

pub type AppResult<T> = Result<T, AppError>;
