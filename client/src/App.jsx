import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Games from './pages/Games';
import GameDetail from './pages/GameDetail';
import Leaderboard from './pages/Leaderboard';
import MonthlyLeaderboard from './pages/MonthlyLeaderboard';
import PlayerStats from './pages/PlayerStats';
import Login from './pages/Login';
import AddEditGame from './pages/AddEditGame';
import ImportGames from './pages/ImportGames';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/"               element={<Dashboard />} />
          <Route path="/games"          element={<Games />} />
          <Route path="/games/:id"      element={<GameDetail />} />
          <Route path="/leaderboard"    element={<Leaderboard />} />
          <Route path="/players/:name"  element={<PlayerStats />} />
          <Route path="/login"          element={<Login />} />
          <Route path="/monthly"        element={<MonthlyLeaderboard />} />
          <Route path="/add-game"       element={<ProtectedRoute><AddEditGame /></ProtectedRoute>} />
          <Route path="/edit-game/:id"  element={<ProtectedRoute><AddEditGame /></ProtectedRoute>} />
          <Route path="/import"         element={<ProtectedRoute><ImportGames /></ProtectedRoute>} />
          <Route path="*"               element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
