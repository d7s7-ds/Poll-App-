import express from "express";
import cors from "cors";
import sqlite3 from "sqlite3";
import { nanoid } from "nanoid";

const { Database } = sqlite3;

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ---- SQLite setup ----
const db = new Database("./db.sqlite");

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS polls (
    id TEXT PRIMARY KEY,
    question TEXT NOT NULL,
    options TEXT NOT NULL,          -- JSON array of strings
    votes TEXT NOT NULL,            -- JSON array of numbers
    expiry INTEGER NOT NULL,        -- epoch ms
    hideResults INTEGER NOT NULL,   -- 0/1
    createdAt INTEGER NOT NULL
  )`);
});

const normalizePoll = (row) => ({
  id: row.id,
  question: row.question,
  options: JSON.parse(row.options),
  votes: JSON.parse(row.votes),
  expiry: row.expiry,
  hideResultsUntilVoted: !!row.hideResults,
  createdAt: row.createdAt
});

// Health
app.get("/api/health", (req, res) => res.json({ ok: true }));

// Create poll
app.post("/api/polls", (req, res) => {
  try {
    const { question, options, expiryHours = 24, hideResultsUntilVoted = false } = req.body || {};
    if (!question || !Array.isArray(options)) {
      return res.status(400).json({ error: "question and options are required" });
    }
    const cleanOpts = options.map(o => String(o||"").trim()).filter(Boolean);
    if (cleanOpts.length < 2 || cleanOpts.length > 6) {
      return res.status(400).json({ error: "Provide 2–6 non-empty options" });
    }
    const id = nanoid(8);
    const now = Date.now();
    const expiry = now + Math.max(1, Math.min(168, Number(expiryHours)||24)) * 60 * 60 * 1000;
    const votes = Array(cleanOpts.length).fill(0);

    db.run(
      `INSERT INTO polls (id, question, options, votes, expiry, hideResults, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, question.trim(), JSON.stringify(cleanOpts), JSON.stringify(votes), expiry, hideResultsUntilVoted ? 1 : 0, now],
      (err) => {
        if (err) return res.status(500).json({ error: "DB insert failed", details: err.message });
        res.status(201).json({ id });
      }
    );
  } catch (e) {
    res.status(500).json({ error: "Unexpected error", details: e.message });
  }
});

// Get poll by id
app.get("/api/polls/:id", (req, res) => {
  const { id } = req.params;
  db.get(`SELECT * FROM polls WHERE id = ?`, [id], (err, row) => {
    if (err) return res.status(500).json({ error: "DB read failed", details: err.message });
    if (!row) return res.status(404).json({ error: "Poll not found" });
    res.json(normalizePoll(row));
  });
});

// List polls (latest first, limited)
app.get("/api/polls", (req, res) => {
  const limit = Math.min(100, Number(req.query.limit) || 20);
  db.all(`SELECT * FROM polls ORDER BY createdAt DESC LIMIT ?`, [limit], (err, rows) => {
    if (err) return res.status(500).json({ error: "DB read failed", details: err.message });
    res.json(rows.map(normalizePoll));
  });
});

// Vote
app.post("/api/polls/:id/vote", (req, res) => {
  const { id } = req.params;
  const { optionIndex } = req.body || {};
  db.get(`SELECT * FROM polls WHERE id = ?`, [id], (err, row) => {
    if (err) return res.status(500).json({ error: "DB read failed", details: err.message });
    if (!row) return res.status(404).json({ error: "Poll not found" });

    const opts = JSON.parse(row.options);
    let votes = JSON.parse(row.votes);

    const idx = Number(optionIndex);
    if (!Number.isInteger(idx) || idx < 0 || idx >= opts.length) {
      return res.status(400).json({ error: "Invalid option index" });
    }

    // check expiry
    if (Date.now() > row.expiry) {
      return res.status(400).json({ error: "Poll has expired" });
    }

    votes[idx] = (votes[idx] || 0) + 1;

    db.run(`UPDATE polls SET votes = ? WHERE id = ?`, [JSON.stringify(votes), id], (uErr) => {
      if (uErr) return res.status(500).json({ error: "DB update failed", details: uErr.message });
      res.json({ ok: true, votes });
    });
  });
});

// Simple Server-Sent Events for live updates
app.get("/api/polls/:id/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const { id } = req.params;
  const interval = setInterval(() => {
    db.get(`SELECT * FROM polls WHERE id = ?`, [id], (err, row) => {
      if (!err && row) {
        res.write(`data: ${JSON.stringify(normalizePoll(row))}\n\n`);
      }
    });
  }, 1500);

  req.on("close", () => clearInterval(interval));
});

app.listen(PORT, () => {
  console.log(`QuickPoll server listening on http://localhost:${PORT}`);
});
