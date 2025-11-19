mosquitto -c mosquitto.conf
# Start the backend (use the actual file in the repo)
node server.cjs &

# Start the frontend dev server
npm run dev