const BASE = '/api';

const authHeaders = (token) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

export async function loginApi(password) {
  const res = await fetch(`${BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  return res.json();
}

export async function getGames() {
  const res = await fetch(`${BASE}/games`);
  return res.json();
}

export async function getGame(id) {
  const res = await fetch(`${BASE}/games/${id}`);
  return res.json();
}

export async function createGame(data, token) {
  const res = await fetch(`${BASE}/games`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateGame(id, data, token) {
  const res = await fetch(`${BASE}/games/${id}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteGame(id, token) {
  const res = await fetch(`${BASE}/games/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  return res.json();
}
