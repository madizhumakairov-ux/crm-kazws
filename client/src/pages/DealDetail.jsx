import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import Comments from './Comments';

const TABS = [
  { id: 'overview', label: 'Обзор', icon: '📋' },
  { id: 'comments', label: 'Комментарии', icon: '💬' },
  { id: 'tasks', label: 'Задачи', icon: '✅' },
  { id: 'history', label: 'История', icon: '📜' },
];

export default function DealDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deal, setDeal] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [stages, setStages] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  // Task form
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', due_date: '', priority: 'medium' });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [dealRes, contactsRes, companiesRes, stagesRes, tasksRes, interactionsRes] = await Promise.all([
        api.get(`/deals/${id}`),
        api.get('/contacts'),
        api.get('/companies'),
        api.get('/stages'),
        api.get('/tasks', { params: { deal_id: id } }),
        api.get('/interactions', { params: { deal_id: id } }),
      ]);
      setDeal(dealRes.data);
      setForm(dealRes.data);
      setContacts(contactsRes.data);
      setCompanies(companiesRes.data);
      setStages(stagesRes.data);
      setTasks(tasksRes.data);
      setInteractions(interactionsRes.data);
    } catch (err) {
      console.error('Failed to load deal:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        value: parseFloat(form.value) || 0,
        stage: form.stage,
        contact_id: form.contact_id || null,
        company_id: form.company_id || null,
        notes: form.notes,
      };
      const res = await api.put(`/deals/${id}`, payload);
      setDeal(res.data);
      setForm(res.data);
      setEditing(false);
    } catch (err) {
      alert('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setForm(deal);
    setEditing(false);
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;
    try {
      const res = await api.post('/tasks', {
        ...taskForm,
        deal_id: parseInt(id),
      });
      setTasks([res.data, ...tasks]);
      setTaskForm({ title: '', due_date: '', priority: 'medium' });
      setShowTaskForm(false);
    } catch (err) {
      alert('Ошибка создания задачи');
    }
  };

  const handleToggleTask = async (task) => {
    const nextStatus = task.status === 'done' ? 'pending' : task.status === 'pending' ? 'in_progress' : 'done';
    try {
      const res = await api.put(`/tasks/${task.id}`, { status: nextStatus });
      setTasks(tasks.map((t) => (t.id === task.id ? res.data : t)));
    } catch (err) {
      alert('Ошибка обновления');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Удалить задачу?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(tasks.filter((t) => t.id !== taskId));
    } catch (err) {
      alert('Ошибка удаления');
    }
  };

  const formatValue = (value) => {
    if (!value) return '0 ₸';
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M ₸`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K ₸`;
    return `${value} ₸`;
  };

  const getStageLabel = (stageId) => {
    const stage = stages.find((s) => s.name === stageId);
    return stage ? stage.name : stageId;
  };

  const getStageColor = (stageId) => {
    const stage = stages.find((s) => s.name === stageId);
    return stage ? stage.color : '#6B7280';
  };

  const priorityLabels = { low: 'Низкий', medium: 'Средний', high: 'Высокий' };
  const priorityColors = {
    low: 'bg-blue-500/10 text-blue-400',
    medium: 'bg-yellow-500/10 text-yellow-400',
    high: 'bg-red-500/10 text-red-400',
  };
  const statusLabels = { pending: 'Ожидает', in_progress: 'В работе', done: 'Выполнено' };
  const statusIcons = { pending: '⬜', in_progress: '🔄', done: '✅' };

  const interactionTypeLabels = { call: '📞 Звонок', email: '📧 Письмо', meeting: '🤝 Встреча', note: '📝 Заметка' };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Build history timeline from interactions + comments + tasks
  const buildHistory = () => {
    const items = [];

    interactions.forEach((i) => {
      items.push({
        type: 'interaction',
        date: i.date || i.created_at,
        title: i.subject,
        description: i.description,
        icon: interactionTypeLabels[i.type]?.split(' ')[0] || '📌',
        meta: interactionTypeLabels[i.type]?.split(' ').slice(1).join(' ') || i.type,
      });
    });

    tasks.forEach((t) => {
      items.push({
        type: 'task',
        date: t.created_at,
        title: `Задача: ${t.title}`,
        description: `Статус: ${statusLabels[t.status]}, Приоритет: ${priorityLabels[t.priority]}`,
        icon: statusIcons[t.status] || '✅',
        meta: 'Задача',
      });
    });

    items.sort((a, b) => new Date(b.date) - new Date(a.date));
    return items;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-dark-400">Загрузка...</div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="text-center py-12">
        <p className="text-dark-400 text-lg">Сделка не найдена</p>
        <button onClick={() => navigate('/deals')} className="btn-primary mt-4">
          ← Вернуться к сделкам
        </button>
      </div>
    );
  }

  const history = buildHistory();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/deals')}
            className="text-dark-400 hover:text-dark-200 transition-colors"
            title="Назад к сделкам"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            {editing ? (
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="input-field text-xl font-bold"
              />
            ) : (
              <h1 className="text-2xl font-bold text-dark-100">{deal.title}</h1>
            )}
            <div className="flex items-center gap-3 mt-1">
              <span
                className="text-xs px-3 py-1 rounded-full text-white font-medium"
                style={{ backgroundColor: getStageColor(deal.stage) }}
              >
                {getStageLabel(deal.stage)}
              </span>
              <span className="text-primary-400 font-semibold text-lg">
                {editing ? (
                  <input
                    type="number"
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: e.target.value })}
                    className="input-field w-40 text-lg"
                  />
                ) : (
                  formatValue(deal.value)
                )}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button onClick={handleCancelEdit} className="btn-secondary">
                Отмена
              </button>
              <button onClick={handleSave} disabled={saving} className="btn-primary">
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </>
          ) : (
            <button onClick={() => setEditing(true)} className="btn-primary">
              ✏️ Редактировать
            </button>
          )}
        </div>
      </div>

      {/* Main layout */}
      <div className="flex gap-6">
        {/* Left side - Tabs (70%) */}
        <div className="flex-[7] min-w-0">
          {/* Tab navigation */}
          <div className="flex border-b border-dark-700 mb-6">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-400'
                    : 'border-transparent text-dark-400 hover:text-dark-200'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-400 mb-1">Название</label>
                  {editing ? (
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="input-field"
                    />
                  ) : (
                    <p className="text-dark-100">{deal.title}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-400 mb-1">Сумма</label>
                  {editing ? (
                    <input
                      type="number"
                      value={form.value}
                      onChange={(e) => setForm({ ...form, value: e.target.value })}
                      className="input-field"
                    />
                  ) : (
                    <p className="text-primary-400 font-semibold">{formatValue(deal.value)}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-400 mb-1">Этап</label>
                  {editing ? (
                    <select
                      value={form.stage}
                      onChange={(e) => setForm({ ...form, stage: e.target.value })}
                      className="input-field"
                    >
                      {stages.map((s) => (
                        <option key={s.name} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-dark-100">{getStageLabel(deal.stage)}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-400 mb-1">Контакт</label>
                  {editing ? (
                    <select
                      value={form.contact_id || ''}
                      onChange={(e) => setForm({ ...form, contact_id: e.target.value })}
                      className="input-field"
                    >
                      <option value="">Без контакта</option>
                      {contacts.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.first_name} {c.last_name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-dark-100">{deal.contact_name || '—'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-400 mb-1">Компания</label>
                  {editing ? (
                    <select
                      value={form.company_id || ''}
                      onChange={(e) => setForm({ ...form, company_id: e.target.value })}
                      className="input-field"
                    >
                      <option value="">Без компании</option>
                      {companies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-dark-100">{deal.company_name || '—'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-400 mb-1">Дата закрытия</label>
                  <p className="text-dark-100">{formatDate(deal.closed_at)}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-400 mb-1">Заметки</label>
                {editing ? (
                  <textarea
                    value={form.notes || ''}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="input-field"
                    rows={4}
                  />
                ) : (
                  <p className="text-dark-300 whitespace-pre-wrap">{deal.notes || 'Нет заметок'}</p>
                )}
              </div>
            </div>
          )}

          {/* Comments Tab */}
          {activeTab === 'comments' && <Comments entityType="deal" entityId={parseInt(id)} />}

          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-dark-200 font-medium">Задачи по сделке</h3>
                <button onClick={() => setShowTaskForm(!showTaskForm)} className="btn-primary text-sm">
                  {showTaskForm ? '✕ Отмена' : '+ Добавить задачу'}
                </button>
              </div>

              {showTaskForm && (
                <form onSubmit={handleAddTask} className="card space-y-3">
                  <input
                    type="text"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    placeholder="Название задачи"
                    className="input-field"
                    required
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-dark-400 mb-1">Срок</label>
                      <input
                        type="date"
                        value={taskForm.due_date}
                        onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-dark-400 mb-1">Приоритет</label>
                      <select
                        value={taskForm.priority}
                        onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                        className="input-field"
                      >
                        <option value="low">Низкий</option>
                        <option value="medium">Средний</option>
                        <option value="high">Высокий</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="btn-primary w-full">
                    Создать задачу
                  </button>
                </form>
              )}

              {tasks.length === 0 ? (
                <div className="text-center py-8 text-dark-500">
                  <p className="text-lg mb-1">✅</p>
                  <p>Нет задач</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`card flex items-center gap-3 ${task.status === 'done' ? 'opacity-60' : ''}`}
                    >
                      <button
                        onClick={() => handleToggleTask(task)}
                        className="text-xl hover:scale-110 transition-transform flex-shrink-0"
                        title={`Статус: ${statusLabels[task.status]}`}
                      >
                        {statusIcons[task.status]}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-medium text-sm ${
                              task.status === 'done' ? 'line-through text-dark-500' : 'text-dark-100'
                            }`}
                          >
                            {task.title}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColors[task.priority]}`}>
                            {priorityLabels[task.priority]}
                          </span>
                        </div>
                        {task.due_date && (
                          <p className="text-xs text-dark-500 mt-1">
                            📅 {new Date(task.due_date).toLocaleDateString('ru-RU')}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-dark-500 hover:text-red-400 transition-colors text-sm flex-shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {history.length === 0 ? (
                <div className="text-center py-8 text-dark-500">
                  <p className="text-lg mb-1">📜</p>
                  <p>Нет истории</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-5 top-0 bottom-0 w-px bg-dark-700" />
                  <div className="space-y-4">
                    {history.map((item, index) => (
                      <div key={index} className="relative pl-12">
                        <div className="absolute left-3 top-1 w-4 h-4 rounded-full bg-dark-800 border-2 border-dark-600 flex items-center justify-center text-xs">
                          {item.icon}
                        </div>
                        <div className="bg-dark-900 border border-dark-700 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-dark-200">{item.title}</span>
                            <span className="text-xs text-dark-500">{formatDateTime(item.date)}</span>
                          </div>
                          <span className="text-xs text-dark-500">{item.meta}</span>
                          {item.description && (
                            <p className="text-sm text-dark-400 mt-2">{item.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right side - Sidebar (30%) */}
        <div className="flex-[3] space-y-4">
          {/* Quick info */}
          <div className="card space-y-4">
            <h3 className="text-dark-200 font-medium text-sm border-b border-dark-700 pb-2">
              Информация о сделке
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-dark-500">Создано</p>
                <p className="text-sm text-dark-200">{formatDateTime(deal.created_at)}</p>
              </div>
              <div>
                <p className="text-xs text-dark-500">Обновлено</p>
                <p className="text-sm text-dark-200">{formatDateTime(deal.updated_at)}</p>
              </div>
              {deal.closed_at && (
                <div>
                  <p className="text-xs text-dark-500">Закрыто</p>
                  <p className="text-sm text-dark-200">{formatDateTime(deal.closed_at)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Contact info */}
          {deal.contact_name && (
            <div className="card space-y-3">
              <h3 className="text-dark-200 font-medium text-sm border-b border-dark-700 pb-2">
                👤 Контакт
              </h3>
              <p className="text-sm text-dark-100">{deal.contact_name}</p>
              {deal.contact_id && (
                <button
                  onClick={() => navigate(`/contacts`)}
                  className="text-xs text-primary-400 hover:text-primary-300"
                >
                  Перейти к контакту →
                </button>
              )}
            </div>
          )}

          {/* Company info */}
          {deal.company_name && (
            <div className="card space-y-3">
              <h3 className="text-dark-200 font-medium text-sm border-b border-dark-700 pb-2">
                🏢 Компания
              </h3>
              <p className="text-sm text-dark-100">{deal.company_name}</p>
              {deal.company_id && (
                <button
                  onClick={() => navigate(`/companies`)}
                  className="text-xs text-primary-400 hover:text-primary-300"
                >
                  Перейти к компании →
                </button>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="card space-y-3">
            <h3 className="text-dark-200 font-medium text-sm border-b border-dark-700 pb-2">
              📊 Статистика
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-dark-500">Задач</span>
                <span className="text-sm text-dark-200">{tasks.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-dark-500">Выполнено</span>
                <span className="text-sm text-green-400">{tasks.filter((t) => t.status === 'done').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-dark-500">Взаимодействий</span>
                <span className="text-sm text-dark-200">{interactions.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
