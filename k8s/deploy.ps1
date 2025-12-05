Write-Host "Building Docker images..." -ForegroundColor Green
docker build -t collaboration-board-django:latest ./backend/django_service
docker build -t collaboration-board-fastapi:latest ./backend/fastapi_service
docker build -t collaboration-board-frontend:latest --target production ./frontend

Write-Host "Loading images to minikube..." -ForegroundColor Green
minikube image load collaboration-board-django:latest
minikube image load collaboration-board-fastapi:latest
minikube image load collaboration-board-frontend:latest

Write-Host "Applying Kubernetes manifests..." -ForegroundColor Green
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/postgres-pv.yaml
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/postgres-service.yaml

Write-Host "Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
kubectl wait --for=condition=ready pod -l app=postgres -n collaboration-board --timeout=120s

Write-Host "Deploying application services..." -ForegroundColor Green
kubectl apply -f k8s/django-deployment.yaml
kubectl apply -f k8s/django-service.yaml
kubectl apply -f k8s/fastapi-deployment.yaml
kubectl apply -f k8s/fastapi-service.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml

Write-Host "Waiting for Django to be ready..." -ForegroundColor Yellow
kubectl wait --for=condition=ready pod -l app=django -n collaboration-board --timeout=120s

Write-Host "Running database migrations..." -ForegroundColor Green
$djangoPod = kubectl get pod -n collaboration-board -l app=django -o jsonpath='{.items[0].metadata.name}'
kubectl exec -n collaboration-board $djangoPod -- python manage.py migrate

Write-Host "Deploying Nginx..." -ForegroundColor Green
kubectl apply -f k8s/nginx-configmap.yaml
kubectl apply -f k8s/nginx-deployment.yaml
kubectl apply -f k8s/nginx-service.yaml

Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "Access the application at:" -ForegroundColor Cyan
minikube service nginx-service -n collaboration-board --url
