# Real-Time Collaboration Board

A Trello/Miro-style real-time collaboration board built with Django, FastAPI, React, and WebSockets. This project demonstrates full-stack development with microservices architecture, real-time communication, and modern DevOps practices.

## 🎯 Features

### Core Features (MVP)
- ✅ User authentication and registration (JWT-based)
- ✅ Real-time card CRUD operations via WebSockets
- ✅ Multiple users seeing live updates simultaneously
- ✅ Single board with three columns (To Do, In Progress, Done)

### Advanced Features
- ✅ Workspaces with multiple boards
- ✅ Card assignments and ownership
- ✅ Workspace member management
- ✅ Permission-based access control

## 🏗️ Architecture

### Microservices Design

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   React      │◄────►│    Nginx     │◄────►│  PostgreSQL  │
│   Frontend   │      │   (Proxy)    │      │   Database   │
└──────────────┘      └──────────────┘      └──────────────┘
                             ▲  ▲
                             │  │
                    ┌────────┘  └────────┐
                    │                    │
            ┌───────▼───────┐   ┌───────▼────────┐
            │    Django     │   │    FastAPI     │
            │   Service     │   │    Service     │
            │               │   │                │
            │ • Auth        │   │ • Cards REST   │
            │ • Workspaces  │   │ • WebSocket    │
            │ • Boards      │   │ • Real-time    │
            └───────────────┘   └────────────────┘
```

### Service Responsibilities

**Django Service (Port 8000)**
- User authentication & JWT token management
- Workspace CRUD & member management
- Board CRUD & permissions
- Django Admin interface

**FastAPI Service (Port 8001)**
- Card REST API endpoints
- WebSocket connections for real-time updates
- Board subscription rooms
- Broadcasting card operations

**React Frontend (Port 3000)**
- SPA with React Router
- Authentication UI
- Workspace & board management
- Real-time board view with drag-and-drop
- WebSocket client

**Nginx (Port 80)**
- Reverse proxy for all services
- WebSocket upgrade handling
- Load balancing

**PostgreSQL (Port 5432)**
- Shared database for both backend services
- Persistent data storage

## 🛠️ Technology Stack

### Backend
- **Django 5.0+** - Main API framework
- **Django REST Framework 3.14+** - REST API utilities
- **djangorestframework-simplejwt** - JWT authentication
- **FastAPI 0.104+** - Async framework for WebSockets
- **SQLAlchemy 2.0+** - ORM for FastAPI
- **PostgreSQL 16** - Database
- **python-jose** - JWT validation
- **uvicorn** - ASGI server

### Frontend
- **React 18+** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Navigation
- **TanStack Query** - API state management
- **Axios** - HTTP client
- **WebSocket API** - Real-time communication

### DevOps
- **Docker & Docker Compose** - Containerization
- **Kubernetes** - Orchestration
- **Nginx** - Reverse proxy
- **Gunicorn** - WSGI server

## 📦 Database Schema

### Users (Django built-in)
- id, username, email, password_hash, created_at

### Workspaces
- id, name, description, owner_id (FK), created_at, updated_at

### WorkspaceMembers
- id, workspace_id (FK), user_id (FK), role (owner/admin/member)

### Boards
- id, workspace_id (FK), name, description, created_at, updated_at

### Cards
- id, board_id (FK), title, description, position, column, created_by (FK), created_at, updated_at

### CardAssignments
- id, card_id (FK), user_id (FK), assigned_at

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose installed
- Python 3.11+ (for local development)
- Node.js 18+ (for local development)
- PostgreSQL 16 (for local development without Docker)

### Running with Docker Compose

1. **Clone the repository**
```bash
git clone <repository-url>
cd collaboration_board
```

2. **Start all services**
```bash
docker-compose up --build
```

3. **Run Django migrations** (first time only)
```bash
docker-compose exec django python manage.py migrate
```

4. **Create a superuser** (optional, for Django admin)
```bash
docker-compose exec django python manage.py createsuperuser
```

5. **Access the application**
- Frontend: http://localhost:3000
- Django API: http://localhost:8000
- FastAPI API: http://localhost:8001
- Django Admin: http://localhost:8000/admin
- Nginx (all services): http://localhost

### Local Development Setup

#### Django Service
```bash
cd backend/django_service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # Edit with your config
python manage.py migrate
python manage.py runserver 8000
```

#### FastAPI Service
```bash
cd backend/fastapi_service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # Edit with your config
uvicorn main:app --reload --port 8001
```

#### React Frontend
```bash
cd frontend
npm install
cp .env.example .env  # Edit with your config
npm run dev
```

## 📚 API Documentation

### Django REST API (Port 8000)

#### Authentication
```
POST   /api/auth/register/           - Register new user
POST   /api/auth/login/              - Login (returns JWT tokens)
POST   /api/auth/refresh/            - Refresh access token
POST   /api/auth/logout/             - Logout (blacklist refresh token)
GET    /api/auth/me/                 - Get current user info
```

#### Workspaces
```
GET    /api/workspaces/              - List user's workspaces
POST   /api/workspaces/              - Create workspace
GET    /api/workspaces/{id}/         - Get workspace details
PATCH  /api/workspaces/{id}/         - Update workspace
DELETE /api/workspaces/{id}/         - Delete workspace
POST   /api/workspaces/{id}/members/ - Add member to workspace
DELETE /api/workspaces/{id}/members/{user_id}/ - Remove member
```

#### Boards
```
GET    /api/workspaces/{workspace_id}/boards/       - List boards in workspace
POST   /api/workspaces/{workspace_id}/boards/create/ - Create board
GET    /api/boards/{id}/                            - Get board details
PATCH  /api/boards/{id}/                            - Update board
DELETE /api/boards/{id}/                            - Delete board
```

### FastAPI REST + WebSocket API (Port 8001)

#### Cards (REST)
```
GET    /api/boards/{board_id}/cards   - List cards on board
POST   /api/boards/{board_id}/cards   - Create card
GET    /api/cards/{id}                - Get card details
PATCH  /api/cards/{id}                - Update card
DELETE /api/cards/{id}                - Delete card
POST   /api/cards/{id}/assign         - Assign user to card
DELETE /api/cards/{id}/assign/{user_id} - Unassign user
```

#### WebSocket
```
WS     /ws/boards/{board_id}?token={jwt_token}  - Connect to board for real-time updates
```

### WebSocket Protocol

#### Client → Server
```json
{
  "action": "card.create" | "card.update" | "card.move" | "card.delete",
  "data": {
    "id": 1,
    "title": "Card Title",
    "description": "Card Description",
    "column": "todo" | "in_progress" | "done",
    "position": 0
  }
}
```

#### Server → Client
```json
{
  "type": "card.created" | "card.updated" | "card.moved" | "card.deleted" | "initial_state",
  "data": {
    "id": 1,
    "board_id": 1,
    "title": "Card Title",
    "description": "Card Description",
    "column": "todo",
    "position": 0,
    "created_by": 1,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "assigned_to": [{"id": 1, "user_id": 1}]
  },
  "user": {"user_id": 1, "username": "john"}
}
```

## 🔑 Environment Variables

### Django Service
```env
DJANGO_SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret-key  # MUST match FastAPI
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
POSTGRES_DB=collaboration_board
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:80
```

### FastAPI Service
```env
JWT_SECRET_KEY=your-jwt-secret-key  # MUST match Django
POSTGRES_DB=collaboration_board
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:80
```

### React Frontend
```env
VITE_DJANGO_API_URL=http://localhost:8000
VITE_FASTAPI_API_URL=http://localhost:8001
VITE_WS_URL=ws://localhost:8001
```

## 🧪 Testing

### Backend Testing
```bash
# Django tests
cd backend/django_service
python manage.py test

# FastAPI tests (implement using pytest)
cd backend/fastapi_service
pytest
```

### API Testing with curl

**Register a user:**
```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"testpass123","password2":"testpass123"}'
```

**Login:**
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass123"}'
```

**Create a workspace:**
```bash
curl -X POST http://localhost:8000/api/workspaces/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"name":"My Workspace","description":"Test workspace"}'
```

## ☸️ Kubernetes Deployment

Kubernetes manifests are provided in the `k8s/` directory.

### Deploy to Kubernetes
```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Deploy PostgreSQL
kubectl apply -f k8s/postgres-pv.yaml
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/postgres-service.yaml

# Deploy Django
kubectl apply -f k8s/django-deployment.yaml
kubectl apply -f k8s/django-service.yaml

# Deploy FastAPI
kubectl apply -f k8s/fastapi-deployment.yaml
kubectl apply -f k8s/fastapi-service.yaml

# Deploy Frontend
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml

# Deploy Nginx
kubectl apply -f k8s/nginx-configmap.yaml
kubectl apply -f k8s/nginx-deployment.yaml
kubectl apply -f k8s/nginx-service.yaml
```

### Local Kubernetes Testing with Minikube
```bash
minikube start
kubectl apply -f k8s/
minikube service nginx-service -n collaboration-board
```

## 📁 Project Structure
```
collaboration_board/
├── backend/
│   ├── django_service/          # Django REST API
│   │   ├── config/              # Django settings
│   │   ├── apps/
│   │   │   ├── authentication/  # User auth & JWT
│   │   │   ├── workspaces/      # Workspaces & members
│   │   │   └── boards/          # Boards
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   └── fastapi_service/         # FastAPI WebSocket service
│       ├── app/
│       │   ├── routers/         # Cards & WebSocket endpoints
│       │   ├── schemas/         # Pydantic models
│       │   ├── models.py        # SQLAlchemy models
│       │   ├── database.py
│       │   └── dependencies.py  # JWT validation
│       ├── main.py
│       ├── Dockerfile
│       └── requirements.txt
├── frontend/                    # React TypeScript SPA
│   ├── src/
│   │   ├── api/                 # API clients
│   │   ├── components/          # React components
│   │   ├── hooks/               # Custom hooks (WebSocket)
│   │   ├── pages/               # Page components
│   │   └── stores/              # State management
│   ├── Dockerfile
│   └── package.json
├── nginx/
│   └── nginx.conf               # Reverse proxy config
├── k8s/                         # Kubernetes manifests
├── docker-compose.yml
├── .gitignore
└── README.md
```

## 🎓 Key Technical Highlights

### 1. Microservices Architecture
- Separation of concerns: Django for CRUD, FastAPI for real-time
- Independent scaling capabilities
- Shared database with coordinated schemas

### 2. JWT Token Sharing
- Tokens issued by Django, validated by FastAPI
- Same secret key across services
- Secure cross-service authentication

### 3. WebSocket Connection Management
- Per-board room subscriptions
- Automatic disconnection handling
- Initial state synchronization on connect
- Broadcasting to all users in room

### 4. Docker & Kubernetes
- Multi-stage Dockerfiles for optimized images
- Docker Compose for local development
- Full Kubernetes deployment manifests
- Health checks and readiness probes

### 5. Database Coordination
- Django migrations as source of truth
- FastAPI mirrors Django models with SQLAlchemy
- Both services share PostgreSQL instance

## 🤝 Contributing

Contributions are welcome! This is a portfolio project, but feel free to:
- Report bugs
- Suggest new features
- Submit pull requests

## 📝 License

MIT License - feel free to use this project for your portfolio or learning.

## 👤 Author

**Your Name**
- Portfolio: [your-portfolio-url]
- GitHub: [@your-github-username]
- LinkedIn: [your-linkedin-url]

## 🙏 Acknowledgments

Built as a portfolio project to demonstrate:
- Full-stack development skills
- Microservices architecture
- Real-time communication with WebSockets
- Modern DevOps practices
- Docker and Kubernetes deployment

---

**Tech Stack:** Django • FastAPI • React • TypeScript • PostgreSQL • WebSockets • Docker • Kubernetes • Nginx
