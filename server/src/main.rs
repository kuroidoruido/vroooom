mod config;
mod error;
mod models;
mod routes;
mod storage;

use std::net::SocketAddr;
use std::sync::Arc;

use axum::Router;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use crate::config::Config;
use crate::storage::Storage;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Load .env file (dev only)
    dotenvy::dotenv().ok();

    // Initialize logging
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "vroooom_server=info,tower_http=info".into()),
        )
        .with(tracing_subscriber::fmt::layer().json())
        .init();

    // Load configuration
    let config = Config::from_env();
    tracing::info!(?config, "Starting vroooom-server");

    // Initialize storage
    let storage = Arc::new(Storage::new(config.data_dir.clone()));
    storage.init().await?;

    // CORS configuration
    let cors = if config.allowed_origins.iter().any(|o| o == "*") {
        CorsLayer::new()
            .allow_origin(tower_http::cors::AllowOrigin::any())
            .allow_methods(Any)
            .allow_headers(Any)
    } else {
        CorsLayer::new()
            .allow_origin(
                config
                    .allowed_origins
                    .iter()
                    .map(|s| s.parse().unwrap())
                    .collect::<Vec<_>>(),
            )
            .allow_methods(Any)
            .allow_headers(Any)
    };

    // Build router
    let app = Router::new()
        .merge(routes::health_router())
        .merge(routes::auth::router())
        .merge(routes::data::router())
        .merge(routes::sync::router())
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .with_state(storage);

    // Start server
    let addr = SocketAddr::from(([0, 0, 0, 0], config.port));
    tracing::info!(%addr, "Server listening");

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
