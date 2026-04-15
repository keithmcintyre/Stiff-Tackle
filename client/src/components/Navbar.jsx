import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <span className="navbar-logo">⚽</span>
        <span className="navbar-title">Stiff Tackle FC</span>
      </Link>

      <ul className="navbar-links">
        <li><NavLink to="/" end>Home</NavLink></li>
        <li><NavLink to="/games">Results</NavLink></li>
        <li><NavLink to="/leaderboard">Leaderboard</NavLink></li>
        <li><NavLink to="/monthly">Monthly</NavLink></li>
      </ul>

      <div className="navbar-right">
        {isAdmin ? (
          <>
            <Link to="/import"   className="btn btn-ghost btn-sm">Import CSV</Link>
            <Link to="/add-game" className="btn btn-gold btn-sm">+ Add Game</Link>
            <button onClick={handleLogout} className="btn btn-ghost btn-sm">Logout</button>
          </>
        ) : (
          <Link to="/login" className="btn btn-ghost btn-sm">Admin</Link>
        )}
      </div>
    </nav>
  );
}
