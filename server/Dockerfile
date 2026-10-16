# Build stage (Alpine + musl pour binaire statique)
FROM rust:1.99-alpine AS builder
WORKDIR /app
COPY . .
RUN cargo build --release

# Runtime stage (Alpine minimal)
FROM alpine:3.19
RUN apk add --no-cache ca-certificates
RUN adduser -D -u 1000 vroooom
COPY --from=builder /app/target/release/vroooom-server /usr/local/bin/
USER vroooom
EXPOSE 8080
CMD ["vroooom-server"]
