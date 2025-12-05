#!/bin/bash

echo "Building Docker images..."
docker build -t collaboration-board-django:latest ./backend/django_service
docker build -t collaboration-board-fastapi:latest ./backend/fastapi_service
docker build -t collaboration-board-frontend:latest --target production ./frontend

echo "Loading images to minikube..."
minikube image load collaboration-board-django:latest
minikube image load collaboration-board-fastapi:latest
minikube image load collaboration-board-frontend:latest

echo "Applying Kubernetes manifests..."
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/postgres-pv.yaml
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/postgres-service.yaml

echo "Waiting for PostgreSQL to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres -n collaboration-board --timeout=120s

echo "Deploying application services..."
kubectl apply -f k8s/django-deployment.yaml
kubectl apply -f k8s/django-service.yaml
kubectl apply -f k8s/fastapi-deployment.yaml
kubectl apply -f k8s/fastapi-service.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml

echo "Waiting for Django to be ready..."
kubectl wait --for=condition=ready pod -l app=django -n collaboration-board --timeout=120s

echo "Running database migrations..."
kubectl exec -n collaboration-board $(kubectl get pod -n collaboration-board -l app=django -o jsonpath='{.items[0].metadata.name}') -- python manage.py migrate

echo "Deploying Nginx..."
kubectl apply -f k8s/nginx-configmap.yaml
kubectl apply -f k8s/nginx-deployment.yaml
kubectl apply -f k8s/nginx-service.yaml

echo "Deployment complete!"
echo "Access the application at:"
minikube service nginx-service -n collaboration-board --url
