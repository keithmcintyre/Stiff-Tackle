const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'stiff-tackle-dev-secret-change-in-prod';

const DATA_DIR = path.join(__dirname, 'data');
const GAMES_FILE = path.join(DATA_DIR, 'games.json');
const AUTH_FILE = path.join(DATA_DIR, 'auth.json');

// Initialise data directory and files on first run
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(GAMES_FILE)) fs.writeFileSync(GAMES_FILE, '[]');
if (!fs.existsSync(AUTH_FILE)) {
  const passwordHash = bcrypt.hashSync('rockingdog1234', 10);
  fs.writeFileSync(AUTH_FILE, JSON.stringify({ passwordHash }));
}

app.use(express.json());

// Allow Vite dev server in development
if (process.env.NODE_ENV !== 'production') {
  app.use(cors({ origin: 'http://localhost:5173' }));
}

// Serve the compiled React app
app.use(express.static(path.join(__dirname, 'client/dist')));

// ── Helpers ──────────────────────────────────────────────────────────────────

const readGames = () => JSON.parse(fs.readFileSync(GAMES_FILE, 'utf8'));
const writeGames = (data) => fs.writeFileSync(GAMES_FILE, JSON.stringify(data, null, 2));

const requireAuth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorised' });
  try {
    jwt.verify(header.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// ── Auth ─────────────────────────────────────────────────────────────────────

app.post('/api/login', (req, res) => {
  const { password } = req.body || {};
  if (!password) return res.status(400).json({ error: 'Password required' });

  const { passwordHash } = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8'));
  if (!bcrypt.compareSync(password, passwordHash)) {
    return res.status(401).json({ error: 'Incorrect password' });
  }

  const token = jwt.sign({ admin: true }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token });
});

// ── Games ─────────────────────────────────────────────────────────────────────

app.get('/api/games', (_req, res) => {
  const games = readGames();
  res.json(games.sort((a, b) => new Date(b.date) - new Date(a.date)));
});

app.get('/api/games/:id', (req, res) => {
  const game = readGames().find(g => g.id === req.params.id);
  if (!game) return res.status(404).json({ error: 'Game not found' });
  res.json(game);
});

app.post('/api/games', requireAuth, (req, res) => {
  const games = readGames();
  const game = { ...req.body, id: uuidv4() };
  games.push(game);
  writeGames(games);
  res.status(201).json(game);
});

app.put('/api/games/:id', requireAuth, (req, res) => {
  const games = readGames();
  const idx = games.findIndex(g => g.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Game not found' });
  games[idx] = { ...req.body, id: req.params.id };
  writeGames(games);
  res.json(games[idx]);
});

app.delete('/api/games/:id', requireAuth, (req, res) => {
  const games = readGames();
  const filtered = games.filter(g => g.id !== req.params.id);
  if (filtered.length === games.length) return res.status(404).json({ error: 'Game not found' });
  writeGames(filtered);
  res.json({ success: true });
});

// ── Bulk import ───────────────────────────────────────────────────────────────

app.post('/api/games/import', requireAuth, (req, res) => {
  const { games: incoming } = req.body || {};
  if (!Array.isArray(incoming) || incoming.length === 0) {
    return res.status(400).json({ error: 'Expected a non-empty array of games' });
  }
  const existing = readGames();
  const toAdd    = incoming.map(g => ({ ...g, id: uuidv4() }));
  writeGames([...existing, ...toAdd]);
  res.json({ imported: toAdd.length });
});

// ── Fallback → React app ──────────────────────────────────────────────────────

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

app.listen(PORT, () => console.log(`Stiff Tackle running on http://localhost:${PORT}`));
