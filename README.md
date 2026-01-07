npm run dev to start frontend

node ./server.cjs to start backend server

node ./dashboard.cjs to start simulator

currently uses mosquitto as mqtt broker

Docker
------

Build and run both services with persistent DB volume:

```bash
docker-compose build
docker-compose up -d
```

Frontend will be available at http://localhost:8080 and backend at http://localhost:3001.
The SQLite DB is persisted in the Docker volume `smartbar_data`.