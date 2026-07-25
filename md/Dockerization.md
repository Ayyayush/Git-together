# GitTogether --- Docker Setup

This document records the Docker configuration, ports, commands, and
local container workflow used for GitTogether.

## Architecture

GitTogether is containerized as two services:

-   **Frontend:** React + Vite, built with Node.js and served by Nginx.
-   **Backend:** Node.js + Express.
-   **Database:** MongoDB Atlas (external; not a local Docker
    container).
-   **Orchestration:** Docker Compose manages frontend and backend.

``` text
Browser
  ↓
http://localhost:5175
  ↓
Frontend Container (Nginx :80)
  ↓
http://localhost:7777
  ↓
Backend Container (Node/Express :7777)
  ↓
MongoDB Atlas
```

Docker Compose creates the internal network `gittogether_default`.

## Project Structure

``` text
GitTogether/
├── docker-compose.yml
├── Gittogether/                 # Backend
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── .env
│   └── src/
└── Gittogether-frontend/        # Frontend
    ├── Dockerfile
    ├── .dockerignore
    ├── nginx.conf
    └── src/
```

> Never commit the backend `.env` file or real secrets to GitHub.

## Ports

  Component     Host Port   Container Port Local Address
  ----------- ----------- ---------------- -------------------------
  Frontend           5175               80 `http://localhost:5175`
  Backend            7777             7777 `http://localhost:7777`

## Frontend Dockerfile

``` dockerfile
FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

The first stage builds the Vite application. The final image contains
Nginx and the generated static files rather than the full frontend
development environment.

## Frontend Nginx Configuration

``` nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    gzip on;
    gzip_types
        text/plain
        text/css
        application/json
        application/javascript
        application/xml
        application/xml+rss
        image/svg+xml
        application/vnd.ms-fontobject
        application/x-font-ttf
        font/opentype;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    location = /favicon.ico {
        access_log off;
        log_not_found off;
    }

    location = /robots.txt {
        access_log off;
        log_not_found off;
    }

    error_page 404 /index.html;
}
```

`try_files $uri $uri/ /index.html;` provides the SPA fallback needed for
React Router routes after browser refreshes.

## Backend Dockerfile

``` dockerfile
FROM node:20-alpine AS dependencies

WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

EXPOSE 7777

CMD ["npm", "start"]
```

The production command runs `node src/app.js` through `npm start`.

## Backend .dockerignore

``` text
node_modules
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

.env
.env.*
!.env.example

.git
.gitignore

.vscode
.idea

.DS_Store
Thumbs.db

logs
*.log

coverage
.nyc_output

.cache
.eslintcache

docker-compose*.yml

tmp
temp

dist
build

*.md
```

The `.env` file is excluded from the image/build context and supplied at
runtime.

## Docker Compose

The Compose file is located at `GitTogether/docker-compose.yml`.

``` yaml
services:
  backend:
    build:
      context: ./Gittogether
      dockerfile: Dockerfile
    container_name: gittogether-backend-container
    env_file:
      - ./Gittogether/.env
    ports:
      - "7777:7777"
    restart: unless-stopped

  frontend:
    build:
      context: ./Gittogether-frontend
      dockerfile: Dockerfile
      args:
        VITE_API_URL: http://localhost:7777
    container_name: gittogether-frontend-container
    ports:
      - "5175:80"
    depends_on:
      - backend
    restart: unless-stopped
```

For this local setup, the frontend is compiled with
`VITE_API_URL=http://localhost:7777` because browser-side requests reach
the backend through its published host port.

## Commands Used

Check Docker:

``` powershell
docker --version
```

Build frontend manually from `Gittogether-frontend/`:

``` powershell
docker build --build-arg VITE_API_URL=http://localhost:7777 -t gittogether-frontend .
```

Run frontend manually:

``` powershell
docker run -d -p 5175:80 --name gittogether-frontend-container gittogether-frontend
```

Build backend manually from `Gittogether/`:

``` powershell
docker build -t gittogether-backend .
```

Run backend manually:

``` powershell
docker run -d --env-file .env -p 7777:7777 --name gittogether-backend-container gittogether-backend
```

Inspect images and containers:

``` powershell
docker images
docker ps
docker ps -a
```

Backend logs:

``` powershell
docker logs gittogether-backend-container
```

Remove containers/images when rebuilding:

``` powershell
docker rm -f gittogether-frontend-container gittogether-backend-container
docker rmi gittogether-backend:latest
```

## Docker Compose Commands

Run these from the parent `GitTogether/` directory containing
`docker-compose.yml`.

Build and start:

``` powershell
docker compose up -d --build
```

Check status:

``` powershell
docker compose ps
```

Check backend logs:

``` powershell
docker compose logs backend
```

Follow all logs:

``` powershell
docker compose logs -f
```

Stop and remove Compose containers/network:

``` powershell
docker compose down
```

Restart:

``` powershell
docker compose restart
```

Rebuild after source/config changes:

``` powershell
docker compose up -d --build
```

## Environment Variables and CORS

Backend variables are loaded from `Gittogether/.env` by Compose.

Do not commit MongoDB connection strings, JWT secrets, Groq/API keys,
Razorpay credentials, or other secrets. A sanitized `.env.example` can
document required variable names.

The backend CORS configuration uses `CLIENT_URL`. For local Docker
development, the allowed frontend origin needs to include:

``` text
http://localhost:5175
```

## Verification

`docker compose ps` confirmed both containers were running:

``` text
gittogether-backend-container    Up    0.0.0.0:7777->7777/tcp
gittogether-frontend-container   Up    0.0.0.0:5175->80/tcp
```

`docker compose logs backend` confirmed:

``` text
recommendationAI: Groq initialized with model llama-3.3-70b-versatile
Database connected successfully.
Server is running on port 7777
```

The application was then tested through `http://localhost:5175`.

## Completed

-   Frontend Dockerfile
-   Multi-stage React/Vite production build
-   Nginx frontend server
-   React Router SPA fallback
-   Backend Dockerfile
-   `.dockerignore`
-   Runtime backend environment variables
-   Frontend and backend Docker images
-   Local container testing
-   Docker Compose orchestration
-   Compose network
-   Port mappings
-   MongoDB Atlas connectivity
-   Backend startup verification

## Next: AWS EC2

Local Dockerization and Docker Compose are complete. The next stage is
AWS EC2 deployment and production Nginx/reverse-proxy configuration.
Production domains/API URLs, CORS origins, HTTPS/TLS, and exposed ports
should use production values instead of the local `localhost`
configuration above.
