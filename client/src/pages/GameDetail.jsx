import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getGame, deleteGame } from '../api';
import { calculateGamePoints } from '../utils/points';
import { useAuth } from '../context/AuthContext';

export default function GameDetail() {
  const { id }             = useParams();
  const [game, setGame]    = useState(null);
  const [loading, setLoading] = useState(true);
  const { isAdmin, token } = useAuth();
  const navigate           = useNavigate();

  useEffect(() => {
    getGame(id).then(d => { setGame(d.error ? null : d); setLoading(false); });
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this game? This cannot be undone.')) return;
    await deleteGame(id, token);
    navigate('/games');
  };

  if (loading) return <div className="loading">Loading…</div>;
  if (!game)   return (
    <div className="page">
      <div className="card"><div className="empty-state"><p>Game not found.</p>
        <Link to="/games" className="btn btn-outline" style={{ marginTop: '1rem' }}>Back to Results</Link>
      </div></div>
    </div>
  );

  const r   = game.ourScore > game.theirScore ? 'W' : game.ourScore === game.theirScore ? 'D' : 'L';
  const cls = r === 'W' ? 'badge-win' : r === 'L' ? 'badge-loss' : 'badge-draw';
  const { subtotals, bonuses, totals } = calculateGamePoints(game);
  const sorted = [...game.players].sort((a, b) => totals[b.name] - totals[a.name]);

  const longDate = new Date(game.date + 'T12:00:00').toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="page">
      <div style={{ marginBottom: '1.25rem' }}>
        <Link to="/games" style={{ color: 'var(--gray-400)', textDecoration: 'none', fontSize: '.875rem' }}>
          ← Back to Results
        </Link>
      </div>

      {/* Match header */}
      <div className="card mb-3" style={{ marginBottom: '1.5rem' }}>
        <div className="card-body">
          <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '.8rem', color: 'var(--gray-400)', marginBottom: '.25rem' }}>{longDate}</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>Stiff Tackle vs {game.opponent}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '2.75rem', fontWeight: 900, color: 'var(--green-900)', lineHeight: 1 }}>
                {game.ourScore} – {game.theirScore}
              </div>
              <span className={`badge ${cls}`} style={{ marginTop: '.35rem' }}>
                {r === 'W' ? 'Win' : r === 'L' ? 'Loss' : 'Draw'}
              </span>
            </div>
          </div>
          {isAdmin && (
            <div className="flex gap-1 mt-2">
              <Link to={`/edit-game/${game.id}`} className="btn btn-outline btn-sm">Edit Game</Link>
              <button className="btn btn-danger btn-sm" onClick={handleDelete}>Delete</button>
            </div>
          )}
        </div>
      </div>

      {/* Points breakdown */}
      <div className="card">
        <div className="card-header">
          <h2>Player Points Breakdown</h2>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Player</th>
                <th className="text-center">Played</th>
                <th className="text-right">Goals</th>
                <th className="text-right">Assists</th>
                <th className="text-right" title="Playing + Goals×4 + Assists×3 (Cox: +4 base −1/conceded)">Subtotal</th>
                <th className="text-right">Bonus</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(player => {
                const sub   = subtotals[player.name];
                const bonus = bonuses[player.name];
                const total = totals[player.name];
                const isCox = player.name === 'Cox';
                const coxTip = isCox
                  ? `2 (playing) + 4 (GK) + ${player.goals||0}×4 (goals) + ${player.assists||0}×3 (assists) − ${game.theirScore} (conceded)`
                  : `2 (playing) + ${player.goals||0}×4 (goals) + ${player.assists||0}×3 (assists)`;
                return (
                  <tr key={player.name}>
                    <td>
                      <Link to={`/players/${player.name}`} style={{ color: 'var(--green-900)', fontWeight: 700, textDecoration: 'none' }}>
                        {player.name}
                      </Link>
                      {isCox && <span className="gk-badge">GK</span>}
                    </td>
                    <td className="text-center" style={{ color: player.played ? 'var(--win)' : 'var(--gray-300)', fontWeight: 700 }}>
                      {player.played ? '✓' : '–'}
                    </td>
                    <td className="text-right">{player.played ? player.goals : '–'}</td>
                    <td className="text-right">{player.played ? player.assists : '–'}</td>
                    <td className="text-right" style={{ color: player.played ? 'var(--gray-700)' : 'var(--gray-300)' }}>
                      <span title={player.played ? coxTip : ''}>{player.played ? sub : 0}</span>
                    </td>
                    <td className="text-right" style={{ color: bonus > 0 ? 'var(--gold-dark)' : 'var(--gray-300)', fontWeight: bonus > 0 ? 700 : 400 }}>
                      {bonus > 0 ? `+${bonus}` : '–'}
                    </td>
                    <td className="text-right" style={{ fontWeight: 900, fontSize: '1.05rem', color: total > 0 ? 'var(--green-900)' : 'var(--gray-300)' }}>
                      {total}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '.65rem 1.25rem', background: 'var(--gray-50)', borderTop: '1px solid var(--gray-200)', fontSize: '.75rem', color: 'var(--gray-400)' }}>
          Playing = 2 · Goal = 4 · Assist = 3 · Cox: +4 GK bonus, −1 per goal conceded · Bonus: 1st = 3, 2nd = 2, 3rd = 1 pt
        </div>
      </div>
    </div>
  );
}
