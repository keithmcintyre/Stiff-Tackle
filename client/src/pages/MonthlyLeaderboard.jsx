import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getGames } from '../api';
import { calculateGamePoints, getSeasonStats, getSeasonRecord } from '../utils/points';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function fmtDate(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short',
  });
}

export default function MonthlyLeaderboard() {
  const now   = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1–12
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGames().then(d => { setGames(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  const monthGames = games.filter(g => {
    const d = new Date(g.date + 'T12:00:00');
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  });

  if (loading) return <div className="loading">Loading…</div>;

  const stats  = getSeasonStats(monthGames);
  const list   = Object.values(stats).sort((a, b) => b.totalPoints - a.totalPoints || b.goals - a.goals);
  const record = getSeasonRecord(monthGames);

  // Build a per-player per-game breakdown for the detail table
  const playerGameRows = monthGames.map(game => {
    const { totals, bonuses } = calculateGamePoints(game);
    return { game, totals, bonuses };
  });

  return (
    <div className="page">
      <h1 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '1.25rem' }}>Monthly Leaderboard</h1>

      {/* Month navigator */}
      <div className="card mb-3" style={{ marginBottom: '1.5rem' }}>
        <div style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={prevMonth} className="btn btn-outline btn-sm">← Prev</button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--green-900)' }}>
              {MONTHS[month - 1]} {year}
            </div>
            <div style={{ fontSize: '.8rem', color: 'var(--gray-400)', marginTop: '.2rem' }}>
              {monthGames.length} game{monthGames.length !== 1 ? 's' : ''}
              {monthGames.length > 0 && ` · ${record.wins}W ${record.draws}D ${record.losses}L`}
            </div>
          </div>
          <button onClick={nextMonth} className="btn btn-outline btn-sm" disabled={isCurrentMonth}>
            Next →
          </button>
        </div>
      </div>

      {monthGames.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <p>No games recorded for {MONTHS[month - 1]} {year}.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid-3 mb-3" style={{ marginBottom: '1.5rem' }}>
            {[
              { label: 'Top Scorer',   key: 'goals',       unit: 'goals',   icon: '⚽' },
              { label: 'Top Assister', key: 'assists',     unit: 'assists', icon: '🎯' },
              { label: 'Pts Leader',   key: 'totalPoints', unit: 'pts',     icon: '🏆' },
            ].map(({ label, key, unit, icon }) => {
              const top = list.find(s => s[key] > 0);
              return (
                <div className="stat-card" key={key}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '.4rem' }}>{icon}</div>
                  <div className="label">{label}</div>
                  <div className="value">{top ? top.name : '–'}</div>
                  <div className="sub">{top ? `${top[key]} ${unit}` : 'No data'}</div>
                </div>
              );
            })}
          </div>

          <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
            {/* Points leaderboard */}
            <div className="card">
              <div className="card-header">
                <h2>Points — {MONTHS[month - 1]} {year}</h2>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: 36 }}>#</th>
                      <th>Player</th>
                      <th className="text-right">Played</th>
                      <th className="text-right">G</th>
                      <th className="text-right">A</th>
                      <th className="text-right">Bonus</th>
                      <th className="text-right">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((s, i) => (
                      <tr key={s.name} style={{ background: i === 0 && s.totalPoints > 0 ? 'rgba(244,211,63,.04)' : undefined }}>
                        <td style={{ fontWeight: 700 }}>
                          {i < 3 && s.totalPoints > 0 ? ['🥇','🥈','🥉'][i] : <span style={{ color: 'var(--gray-400)' }}>{i + 1}</span>}
                        </td>
                        <td>
                          <Link to={`/players/${s.name}`} style={{ color: 'var(--green-900)', fontWeight: 700, textDecoration: 'none' }}>
                            {s.name}
                          </Link>
                          {s.name === 'Cox' && <span className="gk-badge">GK</span>}
                        </td>
                        <td className="text-right">{s.gamesPlayed}</td>
                        <td className="text-right">{s.goals}</td>
                        <td className="text-right">{s.assists}</td>
                        <td className="text-right" style={{ color: 'var(--gold-dark)', fontWeight: 600 }}>{s.bonusPoints}</td>
                        <td className="text-right" style={{ fontWeight: 900, fontSize: '1.05rem', color: s.totalPoints > 0 ? 'var(--green-900)' : 'var(--gray-300)' }}>
                          {s.totalPoints}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Games this month */}
            <div className="card">
              <div className="card-header">
                <h2>Results — {MONTHS[month - 1]}</h2>
              </div>
              {monthGames.map(game => {
                const r   = game.ourScore > game.theirScore ? 'W' : game.ourScore === game.theirScore ? 'D' : 'L';
                const cls = r === 'W' ? 'badge-win' : r === 'L' ? 'badge-loss' : 'badge-draw';
                const { totals } = calculateGamePoints(game);
                const mvp = [...game.players]
                  .filter(p => p.played)
                  .sort((a, b) => totals[b.name] - totals[a.name])[0];
                return (
                  <Link
                    key={game.id}
                    to={`/games/${game.id}`}
                    style={{ display: 'block', textDecoration: 'none', color: 'inherit', padding: '.875rem 1.25rem', borderBottom: '1px solid var(--gray-100)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-50)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                      <span className={`badge ${cls}`}>{r}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '.9rem' }}>vs {game.opponent}</div>
                        <div style={{ fontSize: '.75rem', color: 'var(--gray-400)' }}>{fmtDate(game.date)}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, color: 'var(--green-900)', fontSize: '1.05rem' }}>
                          {game.ourScore}–{game.theirScore}
                        </div>
                        {mvp && (
                          <div style={{ fontSize: '.72rem', color: 'var(--gray-400)' }}>
                            ⭐ {mvp.name} ({totals[mvp.name]}pts)
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Per-player per-game breakdown */}
          <div className="card">
            <div className="card-header">
              <h2>Game-by-Game Breakdown — {MONTHS[month - 1]} {year}</h2>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Game</th>
                    <th className="text-center">Score</th>
                    {list.map(s => (
                      <th key={s.name} className="text-right" style={{ minWidth: 60 }}>
                        <Link to={`/players/${s.name}`} style={{ color: 'var(--gray-500)', textDecoration: 'none' }}>
                          {s.name}
                        </Link>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {playerGameRows.map(({ game, totals }) => {
                    const r   = game.ourScore > game.theirScore ? 'W' : game.ourScore === game.theirScore ? 'D' : 'L';
                    const cls = r === 'W' ? 'badge-win' : r === 'L' ? 'badge-loss' : 'badge-draw';
                    return (
                      <tr key={game.id}>
                        <td>
                          <Link to={`/games/${game.id}`} style={{ color: 'var(--green-900)', fontWeight: 600, textDecoration: 'none', fontSize: '.875rem' }}>
                            vs {game.opponent}
                          </Link>
                          <div style={{ fontSize: '.72rem', color: 'var(--gray-400)' }}>{fmtDate(game.date)}</div>
                        </td>
                        <td className="text-center">
                          <div style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{game.ourScore}–{game.theirScore}</div>
                          <span className={`badge ${cls}`}>{r}</span>
                        </td>
                        {list.map(s => {
                          const pts = totals[s.name] ?? 0;
                          const played = game.players.find(p => p.name === s.name)?.played;
                          return (
                            <td key={s.name} className="text-right" style={{ fontWeight: pts > 0 ? 700 : 400, color: pts > 0 ? 'var(--green-900)' : 'var(--gray-300)' }}>
                              {played ? pts : '–'}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: 'var(--gray-50)', borderTop: '2px solid var(--gray-200)' }}>
                    <td colSpan={2} style={{ padding: '.8rem 1rem', fontWeight: 700, color: 'var(--gray-700)', fontSize: '.875rem' }}>
                      Month Total
                    </td>
                    {list.map(s => (
                      <td key={s.name} className="text-right" style={{ padding: '.8rem 1rem', fontWeight: 900, fontSize: '1.05rem', color: s.totalPoints > 0 ? 'var(--green-900)' : 'var(--gray-300)' }}>
                        {s.totalPoints}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
