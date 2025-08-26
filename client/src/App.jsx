import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";

const ProgressBar = ({ percent }) => (
  <div className="progress">
    <div className="progress-fill" style={{ width: `${percent}%` }} />
  </div>
);

export default function App() {
  const { id } = useParams();
  const navigate = useNavigate();
  const loc = useLocation();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [poll, setPoll] = useState(null);

  // Create form state
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [expiryHours, setExpiryHours] = useState(24);
  const [hideResults, setHideResults] = useState(false);

  const totalVotes = useMemo(
    () => (poll?.votes || []).reduce((a, b) => a + b, 0),
    [poll]
  );

  // Fetch poll if viewing
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`${API_BASE}/api/polls/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load poll");
        return r.json();
      })
      .then((data) => setPoll(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  // Live updates via SSE
  useEffect(() => {
    if (!id) return;
    const es = new EventSource(`${API_BASE}/api/polls/${id}/stream`);
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        setPoll(data);
      } catch {}
    };
    es.onerror = () => {
      // silent; SSE may fail in some setups
    };
    return () => es.close();
  }, [id]);

  const addOption = () => {
    if (options.length < 6) setOptions((p) => [...p, ""]);
  };

  const updateOption = (i, val) => {
    setOptions((opts) => opts.map((o, idx) => (idx === i ? val : o)));
  };

  const createPoll = async () => {
    try {
      setError("");
      const clean = options.map((o) => o.trim()).filter(Boolean);
      if (!question.trim()) throw new Error("Please enter a question");
      if (clean.length < 2) throw new Error("Need at least 2 options");

      const res = await fetch(`${API_BASE}/api/polls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.trim(),
          options: clean,
          expiryHours: Number(expiryHours),
          hideResultsUntilVoted: hideResults,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create poll");
      navigate(`/poll/${data.id}`);
    } catch (e) {
      setError(e.message);
    }
  };

  const vote = async (optionIndex) => {
    try {
      setError("");
      if (!poll) return;
      const res = await fetch(`${API_BASE}/api/polls/${poll.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionIndex }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to vote");
      // optimistic UI will be updated by SSE too
      setPoll((p) => ({ ...p, votes: data.votes }));
      localStorage.setItem(`voted-${poll.id}`, "1");
    } catch (e) {
      setError(e.message);
    }
  };

  const hasVoted = poll ? !!localStorage.getItem(`voted-${poll.id}`) : false;
  const canShowResults = poll
    ? !poll.hideResultsUntilVoted || hasVoted
    : false;

  const shareLink = typeof window !== "undefined"
    ? window.location.origin + (id ? `/poll/${id}` : "")
    : "";

  const copyShare = async () => {
    await navigator.clipboard.writeText(shareLink);
    alert("Link copied!");
  };

  return (
    <div className="wrap">
      <div className="nav">
        <div className="brand" onClick={() => navigate("/")}>
          <span className="logo">🗳️</span> QuickPoll
        </div>
        <div className="spacer" />
        {id && (
          <button className="btn ghost" onClick={copyShare}>Copy link</button>
        )}
        <a className="btn" href={id ? `/poll/${id}` : "/"} target="_blank" rel="noreferrer">
          Open in new tab
        </a>
      </div>

      <div className="container">
        {!id && (
          <div className="card">
            <h2>Create a new poll</h2>
            <label>Question</label>
            <textarea
              className="input"
              rows="2"
              maxLength={120}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., Best DB for side projects?"
            />

            {options.map((opt, i) => (
              <input
                key={i}
                className="input"
                type="text"
                placeholder={`Option ${i + 1}`}
                value={opt}
                onChange={(e) => updateOption(i, e.target.value)}
              />
            ))}

            {options.length < 6 && (
              <button className="btn secondary" onClick={addOption}>
                + Add option
              </button>
            )}

            <div className="row">
              <div className="col50">
                <label>Expiry (hours)</label>
                <input
                  className="input"
                  type="number"
                  min={1} max={168}
                  value={expiryHours}
                  onChange={(e) => setExpiryHours(e.target.value)}
                />
              </div>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={hideResults}
                  onChange={(e) => setHideResults(e.target.checked)}
                />
                Hide results until voted
              </label>
            </div>

            <button className="btn primary" onClick={createPoll}>
              Create Poll
            </button>
            {error && <div className="error">{error}</div>}
          </div>
        )}

        {id && (
          <div className="card">
            {loading ? (
              <div>Loading…</div>
            ) : poll ? (
              <>
                <h2 className="question">{poll.question}</h2>
                <div className="meta">
                  Expires in{" "}
                  {Math.max(0, Math.floor((poll.expiry - Date.now()) / (1000*60*60)))}
                  {" "}hrs
                </div>

                <div className="options">
                  {poll.options.map((opt, i) => (
                    <button
                      key={i}
                      className="btn option"
                      onClick={() => vote(i)}
                      disabled={Date.now() > poll.expiry}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                {error && <div className="error">{error}</div>}

                {canShowResults && (
                  <div className="results">
                    <h3>Results</h3>
                    {poll.options.map((opt, i) => {
                      const count = poll.votes[i] || 0;
                      const percent = totalVotes ? Math.round((count / totalVotes) * 100) : 0;
                      return (
                        <div key={i} className="result-row">
                          <div className="result-label">
                            {opt}
                            <span className="count">{count}</span>
                          </div>
                          <ProgressBar percent={percent} />
                          <div className="percent">{percent}%</div>
                        </div>
                      );
                    })}
                    <div className="meta">Total votes: {totalVotes}</div>
                  </div>
                )}
              </>
            ) : (
              <div className="error">Poll not found</div>
            )}
          </div>
        )}
      </div>

      <footer>
        Data stored on server (SQLite). Open in multiple tabs — results update live.
      </footer>
    </div>
  );
}
