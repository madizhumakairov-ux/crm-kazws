import { useState, useEffect } from 'react';
import api from '../api';
import Modal from '../components/Modal';

const typeLabels = { call: 'Звонок', email: 'Письмо', meeting: 'Встреча', note: 'Заметка' };
const typeIcons = { call: '📞', email: '📧', meeting: '🤝', note: '📝' };
const typeColors = {
  call: 'bg-green-500/10 text-green-400 border-green-500/20',
  email: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  meeting: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  note: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
};

export default function Interactions() {
  const [interactions, setInteractions] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [filterType, setFilterType] = useState('');
  const [form, setForm] = useState({ type: 'call', subject: '', description: '', contact_id: '', deal_id: '', date: '' });

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    try {
      const [intRes, contRes, dealRes] = await Promise.all([
        api.get('/interactions'),
        api.get('/contacts'),
        api.get('/deals'),
      ]);
      setInteractions(intRes.data);
      setContacts(contRes.data);
      setDeals(dealRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        contact_id: form.contact_id || null,
        deal_id: form.deal_id || null,
        date: form.date || new Date().toISOString(),
      };
      if (editItem) {
        await api.put(`/interactions/${editItem.id}`, payload);
      } else {
        await api.post('/interactions', payload);
      }
      setShowModal(false);
      setEditItem(null);
      setForm({ type: 'call', subject: '', description: '', contact_id: '', deal_id: '', date: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка');
    }
  }

  function openEdit(item) {
    setEditItem(item);
    setForm({
      type: item.type,
      subject: item.subject,
      description: item.description || '',
      contact_id: item.contact_id || '',
      deal_id: item.deal_id || '',
      date: item.date ? item.date.replace(' ', 'T').slice(0, 16) : '',
    });
    setShowModal(true);
  }

  async function handleDelete(id) {
    if (!confirm('Удалить взаимодействие?')) return;
    try {
      await api.delete(`/interactions/${id}`);
      fetchData();
    } catch (err) {
      alert('Ошибка удаления');
    }
  }

  const filtered = filterType ? interactions.filter(i => i.type === filterType) : interactions;

  if (loading) return <div className="flex items-center justify-center h-64 text-dark-400">Загрузка...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-dark-100">Взаимодействия</h1>
        <button onClick={() => { setEditItem(null); setForm({ type: 'call', subject: '', description: '', contact_id: '', deal_id: '', date: '' }); setShowModal(true); }}
          className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors">
          + Добавить
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setFilterType('')}
          className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${!filterType ? 'bg-primary-500/10 text-primary-400 border-primary-500/20' : 'bg-dark-800 text-dark-400 border-dark-700 hover:border-dark-600'}`}>
          Все
        </button>
        {Object.entries(typeLabels).map(([key, label]) => (
          <button key={key} onClick={() => setFilterType(key)}
            className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${filterType === key ? typeColors[key] : 'bg-dark-800 text-dark-400 border-dark-700 hover:border-dark-600'}`}>
            {typeIcons[key]} {label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-dark-500">Нет взаимодействий</div>
        ) : (
          filtered.map((item) => (
            <div key={item.id} className="relative pl-8 pb-4 border-l-2 border-dark-700 ml-4">
              <div className={`absolute -left-3 top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs border ${typeColors[item.type]}`}>
                {typeIcons[item.type]}
              </div>
              <div className="bg-dark-800 border border-dark-700 rounded-lg p-4 hover:border-dark-600 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs border ${typeColors[item.type]}`}>
                        {typeLabels[item.type]}
                      </span>
                      <span className="text-xs text-dark-500">
                        {new Date(item.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <h3 className="text-sm font-medium text-dark-200">{item.subject}</h3>
                    {item.description && <p className="text-xs text-dark-400 mt-1">{item.description}</p>}
                    <div className="flex gap-3 mt-2 text-xs text-dark-500">
                      {item.contact_name && <span>👤 {item.contact_name}</span>}
                      {item.deal_title && <span>💰 {item.deal_title}</span>}
                      {item.username && <span>🔑 {item.username}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 ml-4">
                    <button onClick={() => openEdit(item)} className="p-1.5 text-dark-400 hover:text-primary-400 rounded transition-colors">✏️</button>
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 text-dark-400 hover:text-red-400 rounded transition-colors">🗑️</button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Редактировать' : 'Новое взаимодействие'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">Тип *</label>
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
              className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-dark-200 focus:outline-none focus:border-primary-500">
              {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">Тема *</label>
            <input type="text" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required
              className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-dark-200 focus:outline-none focus:border-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">Описание</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
              className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-dark-200 focus:outline-none focus:border-primary-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1">Контакт</label>
              <select value={form.contact_id} onChange={e => setForm({ ...form, contact_id: e.target.value })}
                className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-dark-200 focus:outline-none focus:border-primary-500">
                <option value="">—</option>
                {contacts.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1">Сделка</label>
              <select value={form.deal_id} onChange={e => setForm({ ...form, deal_id: e.target.value })}
                className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-dark-200 focus:outline-none focus:border-primary-500">
                <option value="">—</option>
                {deals.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">Дата</label>
            <input type="datetime-local" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
              className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-dark-200 focus:outline-none focus:border-primary-500" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-dark-400 hover:text-dark-200 transition-colors">Отмена</button>
            <button type="submit" className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors">
              {editItem ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
