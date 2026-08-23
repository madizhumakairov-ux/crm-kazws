import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/', label: 'Дашборд', icon: '📊' },
  { path: '/contacts', label: 'Контакты', icon: '👥' },
  { path: '/companies', label: 'Компании', icon: '🏢' },
  { path: '/deals', label: 'Сделки', icon: '💰' },
  { path: '/tasks', label: 'Задачи', icon: '✅' },
  { path: '/interactions', label: 'Взаимодействия', icon: '💬' },
  { path: '/reports', label: 'Отчёты', icon: '📈' },
  { path: '/users', label: 'Команда', icon: '👤' },
];

export default function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="w-64 bg-dark-900 border-r border-dark-700 flex flex-col">
      <div className="p-6 border-b border-dark-700">
        <h1 className="text-xl font-bold text-primary-500">KAZWS CRM</h1>
        <p className="text-xs text-dark-400 mt-1">kazws.kz</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20'
                  : 'text-dark-300 hover:bg-dark-800 hover:text-dark-100'
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-sm font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-dark-700">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-8 h-8 bg-primary-500/20 rounded-full flex items-center justify-center text-primary-400 text-sm font-bold">
            {user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <p className="text-sm font-medium text-dark-200">{user?.username}</p>
            <p className="text-xs text-dark-400">{user?.role === 'admin' ? 'Администратор' : 'Менеджер'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
