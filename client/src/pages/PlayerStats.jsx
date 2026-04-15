import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getGames } from '../api';
import { calculateGamePoints, PLAYERS } from '../utils/points';

function fmtDate(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function PlayerStats() {
  const { name }            = useParams();
  const [games, setGames]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGames().then(d => { setGames(Array.isArray(d) ? d : []); setLoading(false); });
  }, [name]);

  if (loading) return <div className="loading">Loading…</div>;

  if (!PLAYERS.includes(name)) {
    return (
      <div className="page">
        <div className="card">
          <div className="empty-state">
            <p>Player not found.</p>
            <Link to="/leaderboard" className="btn btn-outline" style={{ marginTop: '1rem' }}>Back to Leaderboard</Link>
          </div>
        </div>
      </div>
    );
  }

  // Build per-game rows for this player
  const playerGames = games.map(game => {
    const pd = game.players.find(p => p.name === name);
    if (!pd) return null;
    const { subtotals, bonuses, totals } = calculateGamePoints(game);
    const r = game.ourScore > game.theirScore ? 'W' : game.ourScore === game.theirScore ? 'D' : 'L';
    return { ...game, pd, r, sub: subtotals[name], bonus: bonuses[name], total: totals[name] };
  }).filter(Boolean);

  const played        = playerGames.filter(g => g.pd.played);
  const totalGoals    = played.reduce((s, g) => s + (g.pd.goals   || 0), 0);
  const totalAssists  = played.reduce((s, g) => s + (g.pd.assists || 0), 0);
  const totalPoints   = playerGames.reduce((s, g) => s + g.total, 0);
  const totalBonus    = playerGames.reduce((s, g) => s + g.bonus, 0);
  const avgPts        = played.length > 0 ? (totalPoints / played.length).toFixed(1) : '0.0';

  return (
    <div className="page">
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/leaderboard" style={{ color: 'var(--gray-400)', textDecoration: 'none', fontSize: '.875rem' }}>
          ← Back to Leaderboard
        </Link>
      </div>

      {/* Hero */}
      <div className="hero" style={{ marginBottom: '1.5rem' }}>
        <div className="hero-title">{name}</div>
        <div className="hero-subtitle">
          {name === 'Cox' ? 'Goalkeeper · ' : ''}Stiff Tackle FC
        </div>
        <div className="record">
          <div className="record-item win">
            <div className="num">{totalPoints}</div>
            <div className="lbl">Total Pts</div>
          </div>
          <div className="record-divider" />
          <div className="record-item draw">
            <div className="num">{totalGoals}</div>
            <div className="lbl">Goals</div>
          </div>
          <div className="record-divider" />
          <div className="record-item draw">
            <div className="num">{totalAssists}</div>
            <div className="lbl">Assists</div>
          </div>
          <div className="record-divider" />
          <div className="record-item draw">
            <div className="num">{played.length}</div>
            <div className="lbl">Played</div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid-3 mb-3">
        <div className="stat-card">
          <div className="label">Avg Pts / Game</div>
          <div className="value">{avgPts}</div>
          <div className="sub">per game played</div>
        </div>
        <div className="stat-card">
          <div className="label">Bonus Points</div>
          <div className="value">{totalBonus}</div>
          <div className="sub">from {playerGames.length} game{playerGames.length !== 1 ? 's' : ''}</div>
        </div>
        <div className="stat-card">
          <div className="label">G + A</div>
          <div className="value">{totalGoals + totalAssists}</div>
          <div className="sub">{totalGoals} goals, {totalAssists} assists</div>
        </div>
      </div>

      {/* Game history */}
      <div className="card">
        <div className="card-header"><h2>Game History</h2></div>
        {playerGames.length === 0 ? (
          <div className="empty-state"><p>No games recorded yet.</p></div>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Opponent</th>
                    <th className="text-center">Score</th>
                    <th className="text-center">Result</th>
                    <th className="text-center">Played</th>
                    <th className="text-right">Goals</th>
                    <th className="text-right">Assists</th>
                    <th className="text-right">Subtotal</th>
                    <th className="text-right">Bonus</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {playerGames.map(g => {
                    const cls = g.r === 'W' ? 'badge-win' : g.r === 'L' ? 'badge-loss' : 'badge-draw';
                    return (
                      <tr key={g.id}>
                        <td style={{ fontSize: '.8rem', color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>{fmtDate(g.date)}</td>
                        <td>
                          <Link to={`/games/${g.id}`} style={{ color: 'var(--green-900)', fontWeight: 600, textDecoration: 'none' }}>
                            vs {g.opponent}
                          </Link>
                        </td>
                        <td className="text-center" style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{g.ourScore}–{g.theirScore}</td>
                        <td className="text-center"><span className={`badge ${cls}`}>{g.r}</span></td>
                        <td className="text-center" style={{ color: g.pd.played ? 'var(--win)' : 'var(--gray-300)', fontWeight: 700 }}>
                          {g.pd.played ? '✓' : '–'}
                        </td>
                        <td className="text-right">{g.pd.played ? g.pd.goals   : '–'}</td>
                        <td className="text-right">{g.pd.played ? g.pd.assists : '–'}</td>
                        <td className="text-right">{g.sub}</td>
                        <td className="text-right" style={{ color: g.bonus > 0 ? 'var(--gold-dark)' : 'var(--gray-300)', fontWeight: g.bonus > 0 ? 700 : 400 }}>
                          {g.bonus > 0 ? `+${g.bonus}` : '–'}
                        </td>
                        <td className="text-right" style={{ fontWeight: 900, color: g.total > 0 ? 'var(--green-900)' : 'var(--gray-300)' }}>
                          {g.total}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: 'var(--gray-50)', fontWeight: 700 }}>
                    <td colSpan={5} style={{ padding: '.8rem 1rem', color: 'var(--gray-500)', fontSize: '.875rem' }}>Season Total</td>
                    <td className="text-right" style={{ padding: '.8rem 1rem' }}>{totalGoals}</td>
                    <td className="text-right" style={{ padding: '.8rem 1rem' }}>{totalAssists}</td>
                    <td colSpan={2} />
                    <td className="text-right" style={{ padding: '.8rem 1rem', fontWeight: 900, color: 'var(--green-900)', fontSize: '1.05rem' }}>
                      {totalPoints}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
