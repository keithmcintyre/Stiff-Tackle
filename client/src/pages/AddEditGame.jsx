import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getGame, createGame, updateGame } from '../api';
import { useAuth } from '../context/AuthContext';
import { calculateGamePoints, PLAYERS } from '../utils/points';

const defaultPlayers = () =>
  PLAYERS.map(name => ({ name, played: false, goals: 0, assists: 0 }));

export default function AddEditGame() {
  const { id }             = useParams();
  const isEdit             = !!id;
  const navigate           = useNavigate();
  const { token }          = useAuth();
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  const [form, setForm] = useState({
    date:       new Date().toISOString().split('T')[0],
    opponent:   '',
    ourScore:   0,
    theirScore: 0,
    players:    defaultPlayers(),
  });

  useEffect(() => {
    if (!isEdit) return;
    getGame(id).then(data => {
      if (!data.error) setForm(data);
      setLoading(false);
    });
  }, [id]);

  // Keep score inputs as strings while editing so the field can be cleared
  const [ourStr,   setOurStr]   = useState(String(form.ourScore));
  const [themStr,  setThemStr]  = useState(String(form.theirScore));

  // Sync string → form numbers
  const handleOurScore  = v => { setOurStr(v);  setForm(p => ({ ...p, ourScore:   parseInt(v)   || 0 })); };
  const handleThemScore = v => { setThemStr(v); setForm(p => ({ ...p, theirScore: parseInt(v)   || 0 })); };

  const updatePlayer = (name, field, value) => {
    setForm(prev => ({
      ...prev,
      players: prev.players.map(p => {
        if (p.name !== name) return p;
        const updated = { ...p, [field]: value };
        if (field === 'played' && !value) { updated.goals = 0; updated.assists = 0; }
        return updated;
      }),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (isEdit) {
        await updateGame(id, form, token);
        navigate(`/games/${id}`);
      } else {
        const game = await createGame(form, token);
        if (game.error) throw new Error(game.error);
        navigate(`/games/${game.id}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to save. Please try again.');
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">Loading…</div>;

  const { subtotals, bonuses, totals } = calculateGamePoints(form);
  const enteredGoals  = form.players.reduce((s, p) => s + (p.played ? (p.goals || 0) : 0), 0);
  const goalMismatch  = enteredGoals !== Number(form.ourScore) && Number(form.ourScore) > 0;

  return (
    <div className="page" style={{ maxWidth: 780 }}>
      <div style={{ marginBottom: '1rem' }}>
        <Link to={isEdit ? `/games/${id}` : '/games'} style={{ color: 'var(--gray-400)', textDecoration: 'none', fontSize: '.875rem' }}>
          ← Cancel
        </Link>
      </div>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '1.5rem' }}>
        {isEdit ? 'Edit Game' : 'Add New Game'}
      </h1>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        {/* ── Match details ─── */}
        <div className="card mb-3" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header"><h2>Match Details</h2></div>
          <div className="card-body">
            <div className="grid-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.date}
                  onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Opposition Team</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. FC United"
                  value={form.opponent}
                  onChange={e => setForm(p => ({ ...p, opponent: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ margin: 0, flex: 1 }}>
                <label className="form-label">Stiff Tackle</label>
                <input
                  type="number"
                  className="form-control"
                  min="0"
                  value={ourStr}
                  onChange={e => handleOurScore(e.target.value)}
                  required
                />
              </div>
              <div style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--gray-300)', paddingBottom: '.5rem' }}>–</div>
              <div className="form-group" style={{ margin: 0, flex: 1 }}>
                <label className="form-label">Opposition</label>
                <input
                  type="number"
                  className="form-control"
                  min="0"
                  value={themStr}
                  onChange={e => handleThemScore(e.target.value)}
                  required
                />
                {form.theirScore > 0 && (
                  <div style={{ fontSize: '.75rem', color: 'var(--gray-400)', marginTop: '.25rem' }}>
                    Cox: −{form.theirScore} pts for goals conceded
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Player stats ─── */}
        <div className="card mb-3" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h2>Player Stats</h2>
            <span style={{ fontSize: '.8rem', color: goalMismatch ? '#d97706' : 'var(--gray-400)' }}>
              Goals entered: {enteredGoals} / {form.ourScore}
              {goalMismatch && ' ⚠ mismatch'}
            </span>
          </div>

          {/* Column headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 80px 80px 80px 70px', gap: '.75rem', padding: '.5rem 1.5rem', borderBottom: '1px solid var(--gray-200)', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--gray-400)' }}>
            <div>Player</div>
            <div style={{ textAlign: 'center' }}>Played</div>
            <div style={{ textAlign: 'center' }}>Goals</div>
            <div style={{ textAlign: 'center' }}>Assists</div>
            <div style={{ textAlign: 'right' }}>Pts</div>
          </div>

          {form.players.map(player => {
            const total = totals[player.name] ?? 0;
            const bonus = bonuses[player.name] ?? 0;
            return (
              <div
                key={player.name}
                style={{ display: 'grid', gridTemplateColumns: '1.4fr 80px 80px 80px 70px', gap: '.75rem', alignItems: 'center', padding: '.875rem 1.5rem', borderBottom: '1px solid var(--gray-100)' }}
              >
                {/* Name */}
                <div style={{ fontWeight: 700, fontSize: '.95rem' }}>
                  {player.name}
                  {player.name === 'Cox' && <span className="gk-badge">GK</span>}
                </div>

                {/* Played checkbox */}
                <div style={{ textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={player.played}
                    onChange={e => updatePlayer(player.name, 'played', e.target.checked)}
                    style={{ width: 18, height: 18, accentColor: 'var(--green-900)', cursor: 'pointer' }}
                  />
                </div>

                {/* Goals */}
                <div>
                  <input
                    type="number"
                    min="0"
                    disabled={!player.played}
                    value={player.played ? player.goals : ''}
                    onChange={e => updatePlayer(player.name, 'goals', parseInt(e.target.value) || 0)}
                    className="form-control form-control-sm"
                    style={{ width: '100%', opacity: player.played ? 1 : .35 }}
                  />
                </div>

                {/* Assists */}
                <div>
                  <input
                    type="number"
                    min="0"
                    disabled={!player.played}
                    value={player.played ? player.assists : ''}
                    onChange={e => updatePlayer(player.name, 'assists', parseInt(e.target.value) || 0)}
                    className="form-control form-control-sm"
                    style={{ width: '100%', opacity: player.played ? 1 : .35 }}
                  />
                </div>

                {/* Live points */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 900, fontSize: '1.1rem', color: total > 0 ? 'var(--green-900)' : 'var(--gray-300)' }}>
                    {total}
                  </div>
                  {bonus > 0 && (
                    <div style={{ fontSize: '.7rem', color: 'var(--gold-dark)', fontWeight: 700 }}>+{bonus} bonus</div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Bonus preview banner */}
          <div style={{ margin: '0 1.5rem 1.25rem', background: 'var(--gray-50)', borderRadius: 8, padding: '.65rem 1rem', fontSize: '.78rem', color: 'var(--gray-500)', border: '1px solid var(--gray-200)' }}>
            <strong>Bonus preview:</strong>{' '}
            {(() => {
              const bonusList = PLAYERS.map(n => bonuses[n] > 0 ? `${n} +${bonuses[n]}` : null).filter(Boolean);
              return bonusList.length > 0 ? bonusList.join(' · ') : 'No bonus points yet — add goals / assists above';
            })()}
          </div>
        </div>

        {/* ── Actions ─── */}
        <div className="flex gap-2">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Game'}
          </button>
          <Link to={isEdit ? `/games/${id}` : '/games'} className="btn btn-outline">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
