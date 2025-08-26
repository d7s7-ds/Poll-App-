# QuickPoll — Fullstack Polling Application

A modern, full-stack polling application built with React + Vite frontend and Node.js/Express + SQLite backend. Create polls, vote, and see live results in real-time.

![QuickPoll Demo](https://img.shields.io/badge/React-19.0.0-blue) ![Vite](https://img.shields.io/badge/Vite-5.4.0-purple) ![Node.js](https://img.shields.io/badge/Node.js-18+-green) ![Express](https://img.shields.io/badge/Express-4.19.2-lightgrey) ![SQLite](https://img.shields.io/badge/SQLite-5.1.7-blue)

## 🚀 Features

- **Create Polls**: Create polls with 2–6 options, custom expiry times, and "hide results until voted" option
- **Real-time Voting**: Vote once per browser per poll with local storage tracking
- **Live Updates**: Server-Sent Events (SSE) for instant result updates without page refresh
- **Responsive Design**: Modern dark UI that works on desktop and mobile devices
- **SQLite Database**: Lightweight, file-based database for easy deployment
- **RESTful API**: Clean API design with proper error handling

## 📋 Prerequisites

- Node.js 18 or higher
- npm or yarn package manager

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd quickpoll-fullstack
```

### 2. Install Dependencies

**Backend (Server):**
```bash
cd server
npm install
```

**Frontend (Client):**
```bash
cd client
npm install
```

### 3. Run the Application

**Option A: Run both services from root (recommended)**
```bash
# Terminal 1 - Backend
npm run dev:server

# Terminal 2 - Frontend  
npm run dev:client
```

**Option B: Run services individually**
```bash
# Backend (port 3000)
cd server
npm run dev   # or npm start

# Frontend (port 5173) - in a separate terminal
cd client
npm run dev
```

### 4. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000

## 🏗️ Project Structure

```
quickpoll-fullstack/
├── client/                 # React frontend
│   ├── src/
│   │   ├── App.jsx        # Main application component
│   │   ├── main.jsx       # React entry point
│   │   └── styles.css     # Application styles
│   ├── index.html         # HTML template
│   ├── vite.config.js     # Vite configuration
│   └── package.json       # Frontend dependencies
├── server/                # Node.js backend
│   ├── server.js          # Express server and API routes
│   ├── package.json       # Backend dependencies
│   └── db.sqlite          # SQLite database (created automatically)
├── package.json           # Root package with workspace scripts
└── README.md             # This file
```

## 📡 API Documentation

### Poll Endpoints

#### Create a Poll
```http
POST /api/polls
Content-Type: application/json

{
  "question": "What is your favorite color?",
  "options": ["Red", "Blue", "Green"],
  "expiryHours": 24,
  "hideResultsUntilVoted": false
}
```

#### Get Poll by ID
```http
GET /api/polls/:id
```

#### List Recent Polls
```http
GET /api/polls?limit=20
```

#### Vote on a Poll
```http
POST /api/polls/:id/vote
Content-Type: application/json

{
  "optionIndex": 0
}
```

#### Live Updates Stream (SSE)
```http
GET /api/polls/:id/stream
```

### Health Check
```http
GET /api/health
```

## 🔧 Configuration

### Environment Variables

**Client (.env file in client directory):**
```env
VITE_API_BASE=http://localhost:3000
```

**Server (environment variables):**
```bash
PORT=3000  # Server port (default: 3000)
```

## 🎨 Frontend Features

- **Create Poll Form**: Intuitive form with validation for poll creation
- **Responsive Voting Interface**: Clean buttons for voting options
- **Real-time Results**: Live updates via SSE with progress bars
- **Share Functionality**: Copy poll links to share with others
- **Dark Theme**: Modern, eye-friendly dark UI design

## 🗄️ Database Schema

The SQLite database (`server/db.sqlite`) contains a single table:

```sql
CREATE TABLE polls (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  options TEXT NOT NULL,          -- JSON array of strings
  votes TEXT NOT NULL,            -- JSON array of numbers
  expiry INTEGER NOT NULL,        -- epoch milliseconds
  hideResults INTEGER NOT NULL,   -- 0/1 boolean
  createdAt INTEGER NOT NULL      -- epoch milliseconds
);
```

## 🚀 Deployment

### Local Development
Follow the installation steps above. The SQLite database will be created automatically.

### Production Deployment
1. Set environment variables for production
2. Build the frontend: `cd client && npm run build`
3. Serve the built files with a production server
4. Configure reverse proxy if needed

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**: Change the port in environment variables
2. **CORS errors**: Ensure frontend and backend are on compatible origins
3. **Database issues**: Delete `server/db.sqlite` to reset the database

### Development Tips

- Use browser developer tools to monitor network requests
- Check server console logs for backend errors
- The SQLite database file can be inspected with tools like DB Browser for SQLite

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Built with React, Vite, Node.js, Express, and SQLite
- Inspired by modern polling applications
- Uses Server-Sent Events for real-time functionality

---

**QuickPoll** - Create, Share, and Vote on Polls in Real-time! 🗳️
