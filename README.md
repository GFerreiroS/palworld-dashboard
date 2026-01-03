# Palworld Dashboard

A self-hosted web dashboard for managing and monitoring a **Palworld dedicated server** via the official Palworld REST API.

## Features

### Dashboard
- Server info (name, version, description)    
- Player count / max players
- Server uptime and in-game days    
- Palworld server metrics (FPS, frame time)
- Host system metrics (CPU, RAM)
### Player administration
- List of **online and offline players**
- Persisted player history (stored on disk)
- Kick / ban / unban players
- Context menu + modal confirmation
- Ping fetched live
- Background worker collects player history

**NOTE:** The player history will count after you run the dashboard before that it doesnt get it. This is because Palworld REST API doent show a history. In the future will be planned to get the users in the world file.
### Map
- World map 
- Live player positions
- Player name labels
### Settings
- Dashboard settings
- Read-only Palworld server settings (from `/v1/api/settings`)

### Auth & setup
- Login using **Palworld server credentials**
- Session cookie (expires after inactivity)
- First-time setup wizard (also can be put in docker env)

## Requirements

- Docker
- Palworld dedicated server with REST API enabled
- Network access from the dashboard container to the Palworld server

## Configuration

### Environment variables (optional)

| Variable                    | Description                 |
| --------------------------- | --------------------------- |
| `PALWORLD_BASE_URL`         | Palworld REST API base URL  |
| `DASHBOARD_NAME`            | Dashboard display name      |
| `DASHBOARD_REFRESH_SECONDS` | Refresh interval in seconds |

Environment variables **override** `config.yml`.

## Config files

All files live in `/config` (mounted as a volume):

```
config/
├── config.yml          # Main dashboard config
├── config.example.yml  # Template
└── players.json        # Persisted player history
```

If `config.yml` does not exist, it is automatically created from the example.

## How to run

### Docker usage

You can use `docker run` or compose. Its recommended using compose.

#### Docker compose

```yaml
services:
  palworld-dash:
    image: ses1234567890/palworld-dash:latest
    container-name: palworld-dash
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - PALWORLD_BASIC_AUTH=Basic QWRtaW46QWRtaW4= # Admin/admin
      - PALWORLD_BASE_URL=PALWORLD_SERVER_IP:8212 # Optional but recommended
      - DASHBOARD_NAME=PALWORLD DASHBOARD # Optional
      - DASHBOARD_REFRESH_SECONDS=5 # Optional
    volumes:
      - ./config:/config
```
Then run:
```bash
docker compose up -d
```
Connect to the server via `http://PALWORLD_BASE_URL:3000`

PALWORLD_BASIC_AUTH is needed in order for the worker to function, if this is incorrect it will not log the connected users when the dashboard is not rendered.

#### Docker run

```bash
docker run -d \
  --name palworld-dash \
  --restart unless-stopped \
  -p 3000:3000 \
  -v ./config:/config \
  -e PALWORLD_BASIC_AUTH=Basic QWRtaW46QWRtaW4= \
  -e PALWORLD_BASE_URL=http://YOUR_PALWORLD_SERVER:8212 \
  -e DASHBOARD_NAME="Palworld Dashboard" \
  -e DASHBOARD_REFRESH_SECONDS=2 \
  ses1234567890/palworld-dash:latest
```
Connect to the server via `http://PALWORLD_BASE_URL:3000`

## Known things

There is a list that I know that doesnt function as desired. This is because lack of knowledge or are planned in the future.

- If the dashboard is run in other server, the metrics of RAM/CPU will be of the hosted server and not the Palworld server. For now host the dashboard in the same machine as Palworld
- Shutdown and close are not added. That is because I want to make reset and start server.
- Yes. The default logo is AI generated, that is a Temp logo.

## Development

```bash
npm install
npm run dev
```

Worker and Next.js run together using `concurrently`.

## License

MIT
