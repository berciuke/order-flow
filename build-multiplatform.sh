#!/bin/bash

echo "Building multiplatform images..."

docker buildx create --name multiplatform-builder --use 2>/dev/null || true
docker buildx inspect --bootstrap

echo "Building backend-api..."
docker buildx build --platform linux/amd64,linux/arm64 \
  -t orderflow-backend-api:latest \
  -f ./backend-api/Dockerfile \
  ./backend-api \
  --load

echo "Building frontend..."
docker buildx build --platform linux/amd64,linux/arm64 \
  -t orderflow-frontend:latest \
  -f ./frontend/Dockerfile \
  ./frontend \
  --load

echo "Building order-service..."
docker buildx build --platform linux/amd64,linux/arm64 \
  -t orderflow-order-service:latest \
  -f ./order-service/Dockerfile \
  ./order-service \
  --load

echo "Build completed successfully!"
echo "Check images: docker images | grep orderflow" 