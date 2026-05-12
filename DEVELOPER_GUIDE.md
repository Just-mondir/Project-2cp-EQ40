# Developer Guide: Kunuz App

This guide explains how developers can run, modify, and debug the Kunuz application using Docker.

## Prerequisites
Before you begin, ensure you have the following installed on your machine:
- [Docker](https://docs.docker.com/get-docker/) & Docker Compose
- Node.js (for local frontend development)
- Python 3.11+ (for local backend development)

---

## 1. Running the App (Docker)

To run the entire stack (Database, Backend, and Frontend) locally via Docker:

1. Open your terminal in the root directory (where `docker-compose.yml` is located).
2. Run the following command:
   ```bash
   docker compose up --build -d
   ```
   * `-d` runs the containers in the background (detached mode).*
   * `--build` ensures your latest code changes are built into the images.*

3. **Access the application:**
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:8000`
   - MongoDB: `localhost:27017`

---

## 2. Making Changes

### Method A: Fast Local Development (Without Docker)
For the fastest development experience (hot-reloading):
1. **Database:** Leave MongoDB running via Docker (`docker compose up -d mongo`).
2. **Backend:** 
   - Navigate to `Backend/heritage_backend`
   - Activate your virtual environment and install requirements.
   - Run `python manage.py runserver`
3. **Frontend:** 
   - Navigate to `Frontend/kunuz-app`
   - Run `npm install` and then `npm run dev`

### Method B: Developing with Docker
If you prefer developing entirely inside Docker, you must rebuild the containers after making changes to the source code:
```bash
docker compose up --build -d
```
*(Note: For production readiness, the current Docker setup copies files into the image. You will need to rebuild to see changes. For hot-reloading in Docker, you would need to set up volume mounts in `docker-compose.yml`.)*

---

## 3. Stopping the App

To stop the running containers without deleting your database data:
```bash
docker compose down
```

To stop the containers **and wipe the database data** completely (useful for a fresh start):
```bash
docker compose down -v
```

---

## 4. Debugging

### Viewing Logs
If something isn't working, checking the logs is the first step:
- **All logs:** `docker compose logs -f`
- **Frontend only:** `docker compose logs -f frontend`
- **Backend only:** `docker compose logs -f backend`
- **Database only:** `docker compose logs -f mongo`

*(Press `Ctrl+C` to exit the log viewer).*

### Accessing a Container Shell
To run commands (like migrations) inside a running container:
- **Backend:**
  ```bash
  docker exec -it projet2cp-backend-1 bash
  # Now you can run: python manage.py migrate
  ```
- **Frontend:**
  ```bash
  docker exec -it projet2cp-frontend-1 sh
  ```
- **Database:**
  ```bash
  docker exec -it projet2cp-mongo-1 mongosh
  ```

### Rebuilding from Scratch
If you encounter strange caching issues during the build process, run a clean build:
```bash
docker compose build --no-cache
docker compose up -d
```
