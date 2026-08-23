import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-dark-900 border-b border-dark-700 px-6 py-4 flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold text-dark-100">Добро пожаловать, {user?.username}</h2>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-dark-400">{new Date().toLocaleDateString('ru-RU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        <button
          onClick={handleLogout}
          className="text-sm text-dark-400 hover:text-red-400 transition-colors"
        >
          Выйти
        </button>
      </div>
    </header>
  );
}
