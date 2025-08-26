# QuickPoll Server
Node + Express + SQLite.

## Scripts
- `npm run dev` – start with nodemon on port 3000
- `npm start` – start with node

## Endpoints
- `POST /api/polls` – create poll
- `GET /api/polls/:id` – get poll
- `POST /api/polls/:id/vote` – vote (body: { optionIndex })
- `GET /api/polls` – list recent polls
- `GET /api/polls/:id/stream` – SSE stream for live updates
