import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getGames } from '../api';
import { calculateGamePoints, getSeasonStats, getSeasonRecord } from '../utils/points';
import { useAuth } from '../context/AuthContext';

function fmtDate(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function Dashboard() {
  const [games, setGames]   = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    getGames().then(d => { setGames(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  if (loading) return <div className="loading">Loading…</div>;

  const record   = getSeasonRecord(games);
  const stats    = getSeasonStats(games);
  const list     = Object.values(stats);
  const topScorer   = [...list].sort((a, b) => b.goals - a.goals)[0];
  const topAssist   = [...list].sort((a, b) => b.assists - a.assists)[0];
  const topPoints   = [...list].sort((a, b) => b.totalPoints - a.totalPoints)[0];
  const recentGames = games.slice(0, 5);

  return (
    <div className="page">
      {/* Hero */}
      <div className="hero">
        <div className="hero-title">Stiff Tackle FC</div>
        <div className="hero-subtitle">5-Aside Season Statistics</div>
        <div className="record">
          <div className="record-item win">
            <div className="num">{record.wins}</div>
            <div className="lbl">Won</div>
          </div>
          <div className="record-divider" />
          <div className="record-item draw">
            <div className="num">{record.draws}</div>
            <div className="lbl">Drawn</div>
          </div>
          <div className="record-divider" />
          <div className="record-item loss">
            <div className="num">{record.losses}</div>
            <div className="lbl">Lost</div>
          </div>
          <div className="record-divider" />
          <div className="record-item draw">
            <div className="num">{record.played}</div>
            <div className="lbl">Played</div>
          </div>
        </div>
        {isAdmin && (
          <Link to="/add-game" className="btn btn-gold" style={{ marginTop: '1.25rem', display: 'inline-flex' }}>
            + Add New Game
          </Link>
        )}
      </div>

      {games.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p>No games recorded yet.</p>
            {isAdmin && (
              <Link to="/add-game" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                Add First Game
              </Link>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Quick-stat highlights */}
          <div className="grid-3 mb-3">
            <div className="stat-card">
              <div className="label">Top Scorer</div>
              <div className="value">{topScorer?.goals > 0 ? topScorer.name : '–'}</div>
              <div className="sub">{topScorer?.goals || 0} goals</div>
            </div>
            <div className="stat-card">
              <div className="label">Top Assister</div>
              <div className="value">{topAssist?.assists > 0 ? topAssist.name : '–'}</div>
              <div className="sub">{topAssist?.assists || 0} assists</div>
            </div>
            <div className="stat-card">
              <div className="label">Points Leader</div>
              <div className="value">{topPoints?.totalPoints > 0 ? topPoints.name : '–'}</div>
              <div className="sub">{topPoints?.totalPoints || 0} pts</div>
            </div>
          </div>

          <div className="grid-2">
            {/* Recent results */}
            <div className="card">
              <div className="card-header">
                <h2>Recent Results</h2>
                <Link to="/games" style={{ fontSize: '.8rem', color: 'var(--green-700)', textDecoration: 'none' }}>
                  All results →
                </Link>
              </div>
              <div>
                {recentGames.map(game => {
                  const r = game.ourScore > game.theirScore ? 'W' : game.ourScore === game.theirScore ? 'D' : 'L';
                  const cls = r === 'W' ? 'badge-win' : r === 'L' ? 'badge-loss' : 'badge-draw';
                  return (
                    <div
                      key={game.id}
                      onClick={() => navigate(`/games/${game.id}`)}
                      style={{ display: 'flex', alignItems: 'center', padding: '.75rem 1.25rem', gap: '.75rem', cursor: 'pointer', borderBottom: '1px solid var(--gray-100)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-50)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}
                    >
                      <span className={`badge ${cls}`}>{r}</span>
                      <span style={{ flex: 1, fontWeight: 600 }}>vs {game.opponent}</span>
                      <span style={{ fontWeight: 800, color: 'var(--green-900)', fontSize: '1.05rem' }}>
                        {game.ourScore}–{game.theirScore}
                      </span>
                      <span style={{ fontSize: '.78rem', color: 'var(--gray-400)', minWidth: 44, textAlign: 'right' }}>
                        {fmtDate(game.date)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Points leaderboard mini */}
            <div className="card">
              <div className="card-header">
                <h2>Points Leaderboard</h2>
                <Link to="/leaderboard" style={{ fontSize: '.8rem', color: 'var(--green-700)', textDecoration: 'none' }}>
                  Full table →
                </Link>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: 36 }}>#</th>
                      <th>Player</th>
                      <th className="text-right">G</th>
                      <th className="text-right">A</th>
                      <th className="text-right">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...list]
                      .sort((a, b) => b.totalPoints - a.totalPoints)
                      .map((s, i) => (
                        <tr key={s.name}>
                          <td style={{ width: 36, fontWeight: 700, color: i === 0 ? 'var(--gold-dark)' : i === 1 ? 'var(--gray-400)' : 'inherit' }}>
                            {i + 1}
                          </td>
                          <td>
                            <Link to={`/players/${s.name}`} style={{ color: 'var(--green-900)', fontWeight: 600, textDecoration: 'none' }}>
                              {s.name}
                            </Link>
                          </td>
                          <td className="text-right">{s.goals}</td>
                          <td className="text-right">{s.assists}</td>
                          <td className="text-right" style={{ fontWeight: 800, color: 'var(--green-900)' }}>{s.totalPoints}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
