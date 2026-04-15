import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getGames } from '../api';
import { getSeasonStats } from '../utils/points';

const SORT_OPTIONS = [
  { key: 'totalPoints', label: 'Points' },
  { key: 'goals',       label: 'Goals' },
  { key: 'assists',     label: 'Assists' },
  { key: 'gamesPlayed', label: 'Games Played' },
];

const RANK_EMOJI = ['🥇', '🥈', '🥉'];

export default function Leaderboard() {
  const [games, setGames]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy]   = useState('totalPoints');

  useEffect(() => {
    getGames().then(d => { setGames(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  if (loading) return <div className="loading">Loading…</div>;

  const stats    = getSeasonStats(games);
  const statsList = Object.values(stats).sort((a, b) => b[sortBy] - a[sortBy] || b.totalPoints - a.totalPoints);

  return (
    <div className="page">
      <h1 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '1.25rem' }}>Season Leaderboard</h1>

      {/* Sort controls */}
      <div className="flex gap-1 mb-3" style={{ flexWrap: 'wrap' }}>
        {SORT_OPTIONS.map(opt => (
          <button
            key={opt.key}
            className={`btn btn-sm ${sortBy === opt.key ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setSortBy(opt.key)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="card mb-3">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 48 }}>#</th>
                <th>Player</th>
                <th
                  className="text-right"
                  style={{ cursor: 'pointer', color: sortBy === 'gamesPlayed' ? 'var(--green-900)' : undefined }}
                  onClick={() => setSortBy('gamesPlayed')}
                >
                  Played
                </th>
                <th
                  className="text-right"
                  style={{ cursor: 'pointer', color: sortBy === 'goals' ? 'var(--green-900)' : undefined }}
                  onClick={() => setSortBy('goals')}
                >
                  Goals
                </th>
                <th
                  className="text-right"
                  style={{ cursor: 'pointer', color: sortBy === 'assists' ? 'var(--green-900)' : undefined }}
                  onClick={() => setSortBy('assists')}
                >
                  Assists
                </th>
                <th className="text-right">Bonus Pts</th>
                <th
                  className="text-right"
                  style={{ cursor: 'pointer', color: sortBy === 'totalPoints' ? 'var(--green-900)' : undefined }}
                  onClick={() => setSortBy('totalPoints')}
                >
                  Total Pts
                </th>
              </tr>
            </thead>
            <tbody>
              {statsList.map((s, i) => (
                <tr key={s.name} style={{ background: i === 0 ? 'rgba(244,211,63,.04)' : undefined }}>
                  <td style={{ fontSize: '1.1rem' }}>
                    {i < 3 ? RANK_EMOJI[i] : <span style={{ color: 'var(--gray-400)', fontWeight: 600 }}>{i + 1}</span>}
                  </td>
                  <td>
                    <Link to={`/players/${s.name}`} style={{ color: 'var(--green-900)', fontWeight: 700, textDecoration: 'none', fontSize: '.95rem' }}>
                      {s.name}
                    </Link>
                    {s.name === 'Cox' && <span className="gk-badge">GK</span>}
                  </td>
                  <td className="text-right" style={{ fontWeight: sortBy === 'gamesPlayed' ? 700 : 400 }}>{s.gamesPlayed}</td>
                  <td className="text-right" style={{ fontWeight: sortBy === 'goals' ? 700 : 400 }}>{s.goals}</td>
                  <td className="text-right" style={{ fontWeight: sortBy === 'assists' ? 700 : 400 }}>{s.assists}</td>
                  <td className="text-right" style={{ color: 'var(--gold-dark)', fontWeight: 600 }}>{s.bonusPoints}</td>
                  <td className="text-right" style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--green-900)' }}>{s.totalPoints}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category highlights */}
      {games.length > 0 && (
        <div className="grid-3">
          {[
            { label: 'Top Scorer',   key: 'goals',       icon: '⚽', unit: 'goals'   },
            { label: 'Top Assister', key: 'assists',     icon: '🎯', unit: 'assists' },
            { label: 'Pts Leader',   key: 'totalPoints', icon: '🏆', unit: 'pts'     },
          ].map(({ label, key, icon, unit }) => {
            const top = Object.values(stats).sort((a, b) => b[key] - a[key])[0];
            return (
              <div className="stat-card" key={key}>
                <div style={{ fontSize: '1.75rem', marginBottom: '.5rem' }}>{icon}</div>
                <div className="label">{label}</div>
                <div className="value">{top?.[key] > 0 ? top.name : '–'}</div>
                <div className="sub">{top?.[key] || 0} {unit}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
