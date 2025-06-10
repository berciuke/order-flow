#!/bin/bash
docker build -t orderflow/backend-api:k8s ./backend-api/
docker build -t orderflow/order-service:k8s ./order-service/  
docker build -t orderflow/frontend:k8s ./frontend/

kubectl apply -f k8s-manifests/namespace/
kubectl apply -f k8s-manifests/storage/
kubectl apply -f k8s-manifests/secrets/
kubectl apply -f k8s-manifests/configmaps/
kubectl apply -f k8s-manifests/databases/
kubectl apply -f k8s-manifests/services/
kubectl apply -f k8s-manifests/apps/
kubectl apply -f k8s-manifests/hpa/
kubectl apply -f k8s-manifests/ingress/
