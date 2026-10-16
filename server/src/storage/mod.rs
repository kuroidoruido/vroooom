use std::path::PathBuf;
use tokio::fs;

use crate::error::{AppError, AppResult};

#[derive(Debug, Clone)]
pub struct Storage {
    data_dir: PathBuf,
}

impl Storage {
    pub fn new(data_dir: PathBuf) -> Self {
        Self { data_dir }
    }

    pub async fn init(&self) -> AppResult<()> {
        fs::create_dir_all(&self.data_dir).await?;
        fs::create_dir_all(self.data_dir.join("users")).await?;
        tracing::info!(path = ?self.data_dir, "Storage initialized");
        Ok(())
    }

    /// Sanitize username to prevent path traversal
    fn sanitize_username(&self, username: &str) -> AppResult<String> {
        if username.contains("..") || username.contains('/') || username.contains('\\') {
            return Err(AppError::InvalidPath(username.to_string()));
        }
        Ok(username.to_string())
    }

    /// Get user directory path
    fn user_dir(&self, username: &str) -> AppResult<PathBuf> {
        let safe = self.sanitize_username(username)?;
        Ok(self.data_dir.join("users").join(safe))
    }

    /// Store a blob (hex string) for a user
    pub async fn store_blob(
        &self,
        username: &str,
        blob_id: &str,
        data: &str,
    ) -> AppResult<()> {
        let user_dir = self.user_dir(username)?;
        fs::create_dir_all(&user_dir).await?;

        let blob_path = user_dir.join(format!("{}.enc", blob_id));
        fs::write(&blob_path, data).await?;

        tracing::debug!(user = username, blob = blob_id, "Blob stored");
        Ok(())
    }

    /// Retrieve a blob
    pub async fn get_blob(&self, username: &str, blob_id: &str) -> AppResult<String> {
        let user_dir = self.user_dir(username)?;
        let blob_path = user_dir.join(format!("{}.enc", blob_id));

        let data = fs::read_to_string(&blob_path).await.map_err(|e| {
            if e.kind() == std::io::ErrorKind::NotFound {
                AppError::BlobNotFound(blob_id.to_string())
            } else {
                AppError::Storage(e)
            }
        })?;

        Ok(data)
    }

    /// List all blobs for a user
    pub async fn list_blobs(&self, username: &str) -> AppResult<Vec<String>> {
        let user_dir = self.user_dir(username)?;

        let mut blobs = Vec::new();
        let mut entries = fs::read_dir(&user_dir).await.map_err(|e| {
            if e.kind() == std::io::ErrorKind::NotFound {
                AppError::UserNotFound(username.to_string())
            } else {
                AppError::Storage(e)
            }
        })?;

        while let Some(entry) = entries.next_entry().await? {
            let path = entry.path();
            if path.extension().and_then(|s| s.to_str()) == Some("enc") {
                if let Some(stem) = path.file_stem().and_then(|s| s.to_str()) {
                    blobs.push(stem.to_string());
                }
            }
        }

        Ok(blobs)
    }

    /// Delete a blob
    pub async fn delete_blob(&self, username: &str, blob_id: &str) -> AppResult<()> {
        let user_dir = self.user_dir(username)?;
        let blob_path = user_dir.join(format!("{}.enc", blob_id));

        fs::remove_file(&blob_path).await.map_err(|e| {
            if e.kind() == std::io::ErrorKind::NotFound {
                AppError::BlobNotFound(blob_id.to_string())
            } else {
                AppError::Storage(e)
            }
        })?;

        Ok(())
    }

    /// Store user auth data (salt, authHash)
    pub async fn store_auth(
        &self,
        username: &str,
        salt: &str,
        auth_hash: &str,
    ) -> AppResult<()> {
        let user_dir = self.user_dir(username)?;
        fs::create_dir_all(&user_dir).await?;

        fs::write(user_dir.join("salt"), salt).await?;
        fs::write(user_dir.join("authHash"), auth_hash).await?;

        tracing::info!(user = username, "Auth data stored");
        Ok(())
    }

    /// Get user auth data
    pub async fn get_auth(&self, username: &str) -> AppResult<(String, String)> {
        let user_dir = self.user_dir(username)?;

        let salt = fs::read_to_string(user_dir.join("salt")).await.map_err(|e| {
            if e.kind() == std::io::ErrorKind::NotFound {
                AppError::UserNotFound(username.to_string())
            } else {
                AppError::Storage(e)
            }
        })?;

        let auth_hash = fs::read_to_string(user_dir.join("authHash")).await.map_err(|e| {
            if e.kind() == std::io::ErrorKind::NotFound {
                AppError::UserNotFound(username.to_string())
            } else {
                AppError::Storage(e)
            }
        })?;

        Ok((salt, auth_hash))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[tokio::test]
    async fn test_store_and_retrieve_blob() {
        let dir = tempdir().unwrap();
        let storage = Storage::new(dir.path().to_path_buf());
        storage.init().await.unwrap();

        storage
            .store_blob("alice", "blob1", "deadbeef")
            .await
            .unwrap();
        let data = storage.get_blob("alice", "blob1").await.unwrap();
        assert_eq!(data, "deadbeef");
    }

    #[tokio::test]
    async fn test_path_traversal_protection() {
        let dir = tempdir().unwrap();
        let storage = Storage::new(dir.path().to_path_buf());
        storage.init().await.unwrap();

        let result = storage.store_blob("alice", "../../etc/passwd", "hack").await;
        assert!(result.is_err());
    }
}
