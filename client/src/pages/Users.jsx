import { useState, useEffect } from 'react';
import api from '../api';
import Modal from '../components/Modal';

const roleLabels = { admin: 'Администратор', user: 'Менеджер' };
const roleColors = { admin: 'bg-red-500/10 text-red-400 border-red-500/20', user: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'user' });

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await api.post('/auth/register', form);
      setShowModal(false);
      setForm({ username: '', email: '', password: '', role: 'user' });
      loadUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Удалить пользователя?')) return;
    try {
      await api.delete(`/auth/users/${id}`);
      loadUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка удаления');
    }
  }

  async function handleRoleChange(id, newRole) {
    try {
      await api.put(`/auth/users/${id}`, { role: newRole });
      loadUsers();
    } catch (err) {
      alert('Ошибка обновления');
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-dark-400">Загрузка...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-dark-100">Команда</h1>
        <button onClick={() => { setForm({ username: '', email: '', password: '', role: 'user' }); setShowModal(true); }}
          className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors">
          + Добавить сотрудника
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user) => (
          <div key={user.id} className="bg-dark-800 border border-dark-700 rounded-xl p-5 hover:border-dark-600 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-500/20 rounded-full flex items-center justify-center text-primary-400 text-lg font-bold">
                  {user.username[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-dark-100">{user.username}</h3>
                  <p className="text-sm text-dark-400">{user.email}</p>
                </div>
              </div>
              <button onClick={() => handleDelete(user.id)} className="text-dark-500 hover:text-red-400 transition-colors text-sm">✕</button>
            </div>

            <div className="flex items-center justify-between">
              <span className={`px-3 py-1 rounded-full text-xs border ${roleColors[user.role]}`}>
                {roleLabels[user.role]}
              </span>
              <select
                value={user.role}
                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                className="bg-dark-700 border border-dark-600 rounded-lg px-2 py-1 text-xs text-dark-300 focus:outline-none focus:border-primary-500"
              >
                <option value="user">Менеджер</option>
                <option value="admin">Администратор</option>
              </select>
            </div>

            <p className="text-xs text-dark-500 mt-3">
              Зарегистрирован: {new Date(user.created_at).toLocaleDateString('ru-RU')}
            </p>
          </div>
        ))}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Новый сотрудник">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">Логин *</label>
            <input type="text" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required
              className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-dark-200 focus:outline-none focus:border-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">Email *</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required
              className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-dark-200 focus:outline-none focus:border-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">Пароль *</label>
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6}
              className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-dark-200 focus:outline-none focus:border-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">Роль</label>
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
              className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-dark-200 focus:outline-none focus:border-primary-500">
              <option value="user">Менеджер</option>
              <option value="admin">Администратор</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-dark-400 hover:text-dark-200 transition-colors">Отмена</button>
            <button type="submit" className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors">Создать</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
