import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getGames, deleteGame } from '../api';
import { useAuth } from '../context/AuthContext';

function fmtDate(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export default function Games() {
  const [games, setGames]     = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin, token }    = useAuth();
  const navigate              = useNavigate();

  useEffect(() => {
    getGames().then(d => { setGames(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this game? This cannot be undone.')) return;
    await deleteGame(id, token);
    setGames(prev => prev.filter(g => g.id !== id));
  };

  if (loading) return <div className="loading">Loading…</div>;

  return (
    <div className="page">
      <div className="flex-between mb-3">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 900 }}>Results</h1>
        {isAdmin && <Link to="/add-game" className="btn btn-primary">+ Add Game</Link>}
      </div>

      {games.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p>No games recorded yet.</p>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Opponent</th>
                  <th className="text-center">Score</th>
                  <th className="text-center">Result</th>
                  {isAdmin && <th></th>}
                </tr>
              </thead>
              <tbody>
                {games.map(game => {
                  const r   = game.ourScore > game.theirScore ? 'W' : game.ourScore === game.theirScore ? 'D' : 'L';
                  const cls = r === 'W' ? 'badge-win' : r === 'L' ? 'badge-loss' : 'badge-draw';
                  const label = r === 'W' ? 'Win' : r === 'L' ? 'Loss' : 'Draw';
                  return (
                    <tr key={game.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/games/${game.id}`)}>
                      <td style={{ color: 'var(--gray-500)', fontSize: '.85rem', whiteSpace: 'nowrap' }}>
                        {fmtDate(game.date)}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--gray-900)' }}>vs {game.opponent}</td>
                      <td className="text-center" style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--green-900)', whiteSpace: 'nowrap' }}>
                        {game.ourScore} – {game.theirScore}
                      </td>
                      <td className="text-center">
                        <span className={`badge ${cls}`}>{label}</span>
                      </td>
                      {isAdmin && (
                        <td className="text-right" style={{ whiteSpace: 'nowrap' }}>
                          <Link
                            to={`/edit-game/${game.id}`}
                            className="btn btn-outline btn-sm"
                            onClick={e => e.stopPropagation()}
                            style={{ marginRight: '.4rem' }}
                          >
                            Edit
                          </Link>
                          <button className="btn btn-danger btn-sm" onClick={e => handleDelete(game.id, e)}>
                            Delete
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
