import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PLAYERS } from '../utils/points';

// ── Template ──────────────────────────────────────────────────────────────────

const TEMPLATE_HEADER = [
  'date', 'opponent', 'our_score', 'their_score',
  'keith_played', 'keith_goals', 'keith_assists',
  'dave_played',  'dave_goals',  'dave_assists',
  'cox_played',   'cox_goals',   'cox_assists',
  'tome_played',  'tome_goals',  'tome_assists',
  'paul_played',  'paul_goals',  'paul_assists',
  'jj_played',    'jj_goals',    'jj_assists',
].join(',');

const TEMPLATE_EXAMPLE =
  '15/04/2026,FC United,3,2,1,2,1,1,1,0,1,0,0,0,1,0,1,1,0,0,1,0,0';

function downloadTemplate() {
  const csv = [
    TEMPLATE_HEADER,
    '# Example row — delete before importing:',
    TEMPLATE_EXAMPLE,
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'stiff-tackle-import-template.csv'; a.click();
  URL.revokeObjectURL(url);
}

// ── CSV parser ────────────────────────────────────────────────────────────────

function parseCSVLine(line) {
  const cols = [];
  let cur = '', inQ = false;
  for (const ch of line) {
    if (ch === '"')        inQ = !inQ;
    else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = ''; }
    else                    cur += ch;
  }
  cols.push(cur.trim());
  return cols;
}

function parseDate(raw = '') {
  const s = raw.trim();
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // DD/MM/YYYY or DD-MM-YYYY
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) {
    const [, d, mo, y] = m;
    return `${y}-${mo.padStart(2,'0')}-${d.padStart(2,'0')}`;
  }
  return '';
}

function parseBool(v = '') {
  const s = String(v).toLowerCase().trim();
  return s === '1' || s === 'yes' || s === 'true' || s === 'y';
}

function parseCSV(text) {
  const lines = text
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'));

  if (lines.length < 2) throw new Error('File needs a header row + at least one data row.');

  const games  = [];
  const errors = [];

  for (let i = 1; i < lines.length; i++) {
    const c = parseCSVLine(lines[i]);
    if (c.length < 4) { errors.push(`Row ${i + 1}: only ${c.length} columns — skipped`); continue; }

    const [date, opponent, ourScore, theirScore,
      kP, kG, kA,
      dP, dG, dA,
      cP, cG, cA,
      tP, tG, tA,
      pP, pG, pA,
      jP, jG, jA,
    ] = c;

    const parsedDate = parseDate(date);
    if (!parsedDate) { errors.push(`Row ${i + 1}: unrecognised date "${date}" — skipped`); continue; }

    games.push({
      date: parsedDate,
      opponent: opponent?.trim() || 'Unknown',
      ourScore:   parseInt(ourScore)   || 0,
      theirScore: parseInt(theirScore) || 0,
      players: [
        { name: 'Keith', played: parseBool(kP), goals: parseInt(kG)||0, assists: parseInt(kA)||0 },
        { name: 'Dave',  played: parseBool(dP), goals: parseInt(dG)||0, assists: parseInt(dA)||0 },
        { name: 'Cox',   played: parseBool(cP), goals: parseInt(cG)||0, assists: parseInt(cA)||0 },
        { name: 'Tome',  played: parseBool(tP), goals: parseInt(tG)||0, assists: parseInt(tA)||0 },
        { name: 'Paul',  played: parseBool(pP), goals: parseInt(pG)||0, assists: parseInt(pA)||0 },
        { name: 'JJ',    played: parseBool(jP), goals: parseInt(jG)||0, assists: parseInt(jA)||0 },
      ],
    });
  }

  return { games, errors };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ImportGames() {
  const [parsed,    setParsed]    = useState(null);   // parsed game rows
  const [parseErrs, setParseErrs] = useState([]);     // per-row warnings
  const [fileErr,   setFileErr]   = useState('');     // fatal parse error
  const [importing, setImporting] = useState(false);
  const [result,    setResult]    = useState(null);   // { imported: n }
  const fileRef = useRef();
  const { token } = useAuth();

  const reset = () => {
    setParsed(null); setParseErrs([]); setFileErr(''); setResult(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    reset();
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const { games, errors } = parseCSV(ev.target.result);
        setParsed(games);
        setParseErrs(errors);
      } catch (err) {
        setFileErr(err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!parsed?.length) return;
    setImporting(true);
    setFileErr('');
    try {
      const res = await fetch('/api/games/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ games: parsed }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult({ imported: data.imported });
      setParsed(null);
      setParseErrs([]);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      setFileErr(err.message || 'Import failed — please try again.');
    }
    setImporting(false);
  };

  return (
    <div className="page" style={{ maxWidth: 960 }}>
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/games" style={{ color: 'var(--gray-400)', textDecoration: 'none', fontSize: '.875rem' }}>
          ← Back to Results
        </Link>
      </div>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '.4rem' }}>Import Games from CSV</h1>
      <p style={{ color: 'var(--gray-500)', marginBottom: '1.75rem', fontSize: '.9rem' }}>
        Upload a CSV file of previous matches. Download the template to see the exact column order.
      </p>

      {/* Format guide */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header"><h2>CSV Format</h2></div>
        <div className="card-body">
          <p style={{ fontSize: '.875rem', color: 'var(--gray-600)', marginBottom: '.75rem' }}>
            Required column order (22 columns):
          </p>
          <code style={{
            display: 'block', background: 'var(--gray-50)', padding: '.6rem .9rem',
            borderRadius: 6, fontSize: '.78rem', wordBreak: 'break-all',
            color: 'var(--gray-700)', border: '1px solid var(--gray-200)', marginBottom: '1rem',
            lineHeight: 1.9,
          }}>
            date, opponent, our_score, their_score,<br />
            <span style={{ color: 'var(--green-700)' }}>keith</span>_played, keith_goals, keith_assists,{' '}
            <span style={{ color: 'var(--green-700)' }}>dave</span>_played, dave_goals, dave_assists,<br />
            <span style={{ color: 'var(--green-700)' }}>cox</span>_played, cox_goals, cox_assists,{' '}
            <span style={{ color: 'var(--green-700)' }}>tome</span>_played, tome_goals, tome_assists,<br />
            <span style={{ color: 'var(--green-700)' }}>paul</span>_played, paul_goals, paul_assists,{' '}
            <span style={{ color: 'var(--green-700)' }}>jj</span>_played, jj_goals, jj_assists
          </code>
          <ul style={{ fontSize: '.85rem', color: 'var(--gray-600)', paddingLeft: '1.25rem', lineHeight: '1.9', marginBottom: '1rem' }}>
            <li><strong>date</strong> — DD/MM/YYYY or YYYY-MM-DD</li>
            <li><strong>*_played</strong> — 1 = played, 0 = didn't play</li>
            <li><strong>scores / goals / assists</strong> — whole numbers (use 0 if none)</li>
            <li>Lines starting with <code>#</code> are skipped (safe for comments)</li>
          </ul>
          <button className="btn btn-outline" onClick={downloadTemplate}>
            ⬇ Download Template
          </button>
        </div>
      </div>

      {/* File upload */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header"><h2>Upload Your CSV</h2></div>
        <div className="card-body">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv,text/plain"
            onChange={handleFile}
            style={{ marginBottom: '1rem', fontSize: '.9rem' }}
          />

          {fileErr && <div className="alert alert-error">{fileErr}</div>}

          {parseErrs.length > 0 && (
            <div className="alert alert-warning">
              <strong>{parseErrs.length} row{parseErrs.length !== 1 ? 's' : ''} skipped:</strong>
              <ul style={{ paddingLeft: '1.25rem', marginTop: '.4rem', lineHeight: '1.8', fontSize: '.85rem' }}>
                {parseErrs.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Success banner */}
      {result && (
        <div className="alert" style={{ background: 'var(--win-bg)', color: 'var(--win)', border: '1px solid #86efac', marginBottom: '1.5rem', fontWeight: 600 }}>
          ✓ Imported {result.imported} game{result.imported !== 1 ? 's' : ''} successfully.{' '}
          <Link to="/games" style={{ color: 'var(--win)' }}>View results →</Link>
        </div>
      )}

      {/* Preview table */}
      {parsed && parsed.length > 0 && (
        <>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header">
              <h2>Preview — {parsed.length} game{parsed.length !== 1 ? 's' : ''} ready to import</h2>
              <span style={{ fontSize: '.8rem', color: 'var(--gray-400)' }}>Check the data below before confirming</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Opponent</th>
                    <th className="text-center">Score</th>
                    {PLAYERS.map(p => (
                      <th key={p} className="text-center" style={{ fontSize: '.68rem', minWidth: 56 }}>{p}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsed.map((g, i) => {
                    const r   = g.ourScore > g.theirScore ? 'W' : g.ourScore === g.theirScore ? 'D' : 'L';
                    const cls = r === 'W' ? 'badge-win' : r === 'L' ? 'badge-loss' : 'badge-draw';
                    return (
                      <tr key={i}>
                        <td style={{ fontSize: '.82rem', whiteSpace: 'nowrap', color: 'var(--gray-500)' }}>{g.date}</td>
                        <td style={{ fontWeight: 600 }}>vs {g.opponent}</td>
                        <td className="text-center" style={{ whiteSpace: 'nowrap' }}>
                          <span style={{ fontWeight: 700 }}>{g.ourScore}–{g.theirScore}</span>{' '}
                          <span className={`badge ${cls}`}>{r}</span>
                        </td>
                        {g.players.map(p => (
                          <td key={p.name} className="text-center" style={{ fontSize: '.8rem', color: p.played ? 'var(--gray-700)' : 'var(--gray-300)' }}>
                            {p.played ? (
                              <>
                                <span title="goals" style={{ fontWeight: 600 }}>{p.goals}G</span>
                                {' '}
                                <span title="assists" style={{ color: 'var(--gray-400)' }}>{p.assists}A</span>
                              </>
                            ) : '–'}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={handleImport} disabled={importing}>
              {importing ? 'Importing…' : `Import ${parsed.length} Game${parsed.length !== 1 ? 's' : ''}`}
            </button>
            <button className="btn btn-outline" onClick={reset}>Cancel</button>
          </div>
        </>
      )}
    </div>
  );
}
