# Docker / Compose instructions

Quick steps to run the project (frontend, backend, mosquitto broker) with Docker Compose.

1) Build and start services (foreground):

```bash
docker compose up --build
```

2) Start in background (detached):

```bash
docker compose up --build -d
```

3) Stop and remove containers:

```bash
docker compose down
```

Notes and tips:
- The Vite dev server runs in the `frontend` container and is exposed on port `5173`.
- The backend listens on port `3001` and is exposed on the host at `http://localhost:3001`.
- Mosquitto is available on the host at `mqtt://localhost:1883`. The `mosquitto.conf` in the repo is mounted into the container.
- If the frontend cannot reach the backend in dev, adjust `VITE_API_URL` in `docker-compose.yml` or in your `.env`.

Viewing logs:

```bash
docker compose logs -f frontend
docker compose logs -f backend
docker compose logs -f mqtt
```

Troubleshooting:
- If dependency installation fails, ensure `package.json` and lockfile are present. The Dockerfiles use `npm ci`.
- If Live reload or HMR doesn't work, confirm Vite started with `--host 0.0.0.0` (the `Dockerfile.frontend` already does this).
