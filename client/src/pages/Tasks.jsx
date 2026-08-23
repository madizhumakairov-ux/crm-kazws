import { useState, useEffect } from 'react';
import api from '../api';
import Modal from '../components/Modal';

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', priority: '' });
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', due_date: '', priority: 'medium', status: 'pending', contact_id: '', deal_id: '' });

  useEffect(() => {
    loadTasks();
    loadContacts();
    loadDeals();
  }, [filter]);

  const loadTasks = async () => {
    try {
      const params = {};
      if (filter.status) params.status = filter.status;
      if (filter.priority) params.priority = filter.priority;
      const res = await api.get('/tasks', { params });
      setTasks(res.data);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadContacts = async () => {
    try {
      const res = await api.get('/contacts');
      setContacts(res.data);
    } catch (err) {
      console.error('Failed to load contacts:', err);
    }
  };

  const loadDeals = async () => {
    try {
      const res = await api.get('/deals');
      setDeals(res.data);
    } catch (err) {
      console.error('Failed to load deals:', err);
    }
  };

  const openCreateModal = () => {
    setEditingTask(null);
    setForm({ title: '', description: '', due_date: '', priority: 'medium', status: 'pending', contact_id: '', deal_id: '' });
    setShowModal(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description || '',
      due_date: task.due_date || '',
      priority: task.priority,
      status: task.status,
      contact_id: task.contact_id || '',
      deal_id: task.deal_id || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        contact_id: form.contact_id || null,
        deal_id: form.deal_id || null,
      };

      if (editingTask) {
        await api.put(`/tasks/${editingTask.id}`, payload);
      } else {
        await api.post('/tasks', payload);
      }
      setShowModal(false);
      loadTasks();
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка сохранения');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить задачу?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      loadTasks();
    } catch (err) {
      alert('Ошибка удаления');
    }
  };

  const toggleStatus = async (task) => {
    const nextStatus = task.status === 'done' ? 'pending' : task.status === 'pending' ? 'in_progress' : 'done';
    try {
      await api.put(`/tasks/${task.id}`, { status: nextStatus });
      loadTasks();
    } catch (err) {
      alert('Ошибка обновления');
    }
  };

  const priorityColors = {
    low: 'bg-blue-500/10 text-blue-400',
    medium: 'bg-yellow-500/10 text-yellow-400',
    high: 'bg-red-500/10 text-red-400',
  };

  const priorityLabels = {
    low: 'Низкий',
    medium: 'Средний',
    high: 'Высокий',
  };

  const statusLabels = {
    pending: 'Ожидает',
    in_progress: 'В работе',
    done: 'Выполнено',
  };

  const statusIcons = {
    pending: '⬜',
    in_progress: '🔄',
    done: '✅',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark-100">Задачи</h1>
        <button onClick={openCreateModal} className="btn-primary">
          + Добавить задачу
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={filter.status}
          onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          className="input-field w-48"
        >
          <option value="">Все статусы</option>
          <option value="pending">Ожидает</option>
          <option value="in_progress">В работе</option>
          <option value="done">Выполнено</option>
        </select>
        <select
          value={filter.priority}
          onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
          className="input-field w-48"
        >
          <option value="">Все приоритеты</option>
          <option value="high">Высокий</option>
          <option value="medium">Средний</option>
          <option value="low">Низкий</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-8 text-dark-400">Загрузка...</div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task.id} className={`card flex items-center gap-4 ${task.status === 'done' ? 'opacity-60' : ''}`}>
              <button
                onClick={() => toggleStatus(task)}
                className="text-2xl hover:scale-110 transition-transform"
              >
                {statusIcons[task.status]}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h3 className={`font-medium ${task.status === 'done' ? 'line-through text-dark-500' : 'text-dark-100'}`}>
                    {task.title}
                  </h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${priorityColors[task.priority]}`}>
                    {priorityLabels[task.priority]}
                  </span>
                </div>
                {task.description && <p className="text-sm text-dark-400 mt-1 truncate">{task.description}</p>}
                <div className="flex items-center gap-4 mt-2 text-xs text-dark-500">
                  {task.due_date && <span>📅 {new Date(task.due_date).toLocaleDateString('ru-RU')}</span>}
                  {task.contact_name && <span>👤 {task.contact_name}</span>}
                  {task.deal_title && <span>💰 {task.deal_title}</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEditModal(task)} className="text-primary-400 hover:text-primary-300 text-sm">Изменить</button>
                <button onClick={() => handleDelete(task.id)} className="text-red-400 hover:text-red-300 text-sm">Удалить</button>
              </div>
            </div>
          ))}
          {tasks.length === 0 && (
            <div className="text-center py-8 text-dark-500">Задачи не найдены</div>
          )}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingTask ? 'Изменить задачу' : 'Новая задача'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Название *</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Описание</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" rows={3} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Срок</label>
              <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Приоритет</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="input-field">
                <option value="low">Низкий</option>
                <option value="medium">Средний</option>
                <option value="high">Высокий</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Статус</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input-field">
                <option value="pending">Ожидает</option>
                <option value="in_progress">В работе</option>
                <option value="done">Выполнено</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Контакт</label>
            <select value={form.contact_id} onChange={(e) => setForm({ ...form, contact_id: e.target.value })} className="input-field">
              <option value="">Без контакта</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Сделка</label>
            <select value={form.deal_id} onChange={(e) => setForm({ ...form, deal_id: e.target.value })} className="input-field">
              <option value="">Без сделки</option>
              {deals.map((d) => (
                <option key={d.id} value={d.id}>{d.title}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Отмена</button>
            <button type="submit" className="btn-primary">{editingTask ? 'Сохранить' : 'Создать'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
