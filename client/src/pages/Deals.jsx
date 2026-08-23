import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Modal from '../components/Modal';
import KanbanBoard from '../components/KanbanBoard';

export default function Deals() {
  const navigate = useNavigate();
  const [deals, setDeals] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('kanban');
  const [showModal, setShowModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const [form, setForm] = useState({ title: '', value: '', stage: 'new', contact_id: '', company_id: '', notes: '' });

  useEffect(() => {
    loadDeals();
    loadContacts();
    loadCompanies();
    loadStages();
  }, []);

  const loadDeals = async () => {
    try {
      const res = await api.get('/deals');
      setDeals(res.data);
    } catch (err) {
      console.error('Failed to load deals:', err);
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

  const loadCompanies = async () => {
    try {
      const res = await api.get('/companies');
      setCompanies(res.data);
    } catch (err) {
      console.error('Failed to load companies:', err);
    }
  };

  const loadStages = async () => {
    try {
      const res = await api.get('/stages');
      setStages(res.data);
    } catch (err) {
      console.error('Failed to load stages:', err);
    }
  };

  const handleStageChange = async (dealId, newStage) => {
    try {
      await api.put(`/deals/${dealId}`, { stage: newStage });
      loadDeals();
    } catch (err) {
      alert('Ошибка обновления');
    }
  };

  const openCreateModal = () => {
    setEditingDeal(null);
    setForm({ title: '', value: '', stage: 'new', contact_id: '', company_id: '', notes: '' });
    setShowModal(true);
  };

  const openEditModal = (deal) => {
    setEditingDeal(deal);
    setForm({
      title: deal.title,
      value: deal.value,
      stage: deal.stage,
      contact_id: deal.contact_id || '',
      company_id: deal.company_id || '',
      notes: deal.notes || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        value: parseFloat(form.value) || 0,
        contact_id: form.contact_id || null,
        company_id: form.company_id || null,
      };

      if (editingDeal) {
        await api.put(`/deals/${editingDeal.id}`, payload);
      } else {
        await api.post('/deals', payload);
      }
      setShowModal(false);
      loadDeals();
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка сохранения');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить сделку?')) return;
    try {
      await api.delete(`/deals/${id}`);
      loadDeals();
    } catch (err) {
      alert('Ошибка удаления');
    }
  };

  const formatValue = (value) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M ₸`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K ₸`;
    return `${value} ₸`;
  };

  const getStageLabel = (stageName) => {
    const stage = stages.find((s) => s.name === stageName);
    return stage ? stage.name : stageName;
  };

  const getStageColor = (stageName) => {
    const stage = stages.find((s) => s.name === stageName);
    return stage ? stage.color : '#6B7280';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark-100">Сделки</h1>
        <div className="flex gap-3">
          <div className="flex bg-dark-800 rounded-lg p-1">
            <button
              onClick={() => setView('kanban')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                view === 'kanban' ? 'bg-primary-500 text-white' : 'text-dark-400 hover:text-dark-200'
              }`}
            >
              Канбан
            </button>
            <button
              onClick={() => setView('table')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                view === 'table' ? 'bg-primary-500 text-white' : 'text-dark-400 hover:text-dark-200'
              }`}
            >
              Таблица
            </button>
          </div>
          <button onClick={openCreateModal} className="btn-primary">
            + Добавить сделку
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-dark-400">Загрузка...</div>
      ) : view === 'kanban' ? (
        <KanbanBoard deals={deals} onStageChange={handleStageChange} onRefresh={loadDeals} />
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="text-left p-4 text-dark-400 text-sm font-medium">Название</th>
                  <th className="text-left p-4 text-dark-400 text-sm font-medium">Сумма</th>
                  <th className="text-left p-4 text-dark-400 text-sm font-medium">Этап</th>
                  <th className="text-left p-4 text-dark-400 text-sm font-medium">Контакт</th>
                  <th className="text-left p-4 text-dark-400 text-sm font-medium">Компания</th>
                  <th className="text-right p-4 text-dark-400 text-sm font-medium">Действия</th>
                </tr>
              </thead>
              <tbody>
                {deals.map((deal) => (
                  <tr key={deal.id} className="border-b border-dark-700/50 hover:bg-dark-800/50">
                    <td className="p-4">
                      <button
                        onClick={() => navigate(`/deals/${deal.id}`)}
                        className="text-dark-100 font-medium hover:text-primary-400 transition-colors text-left"
                      >
                        {deal.title}
                      </button>
                    </td>
                    <td className="p-4 text-primary-400 font-semibold">{formatValue(deal.value)}</td>
                    <td className="p-4">
                      <span
                        className="text-xs text-white px-2 py-1 rounded-full"
                        style={{ backgroundColor: getStageColor(deal.stage) }}
                      >
                        {getStageLabel(deal.stage)}
                      </span>
                    </td>
                    <td className="p-4 text-dark-300 text-sm">{deal.contact_name || '—'}</td>
                    <td className="p-4 text-dark-300 text-sm">{deal.company_name || '—'}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => openEditModal(deal)} className="text-primary-400 hover:text-primary-300 text-sm mr-3">Изменить</button>
                      <button onClick={() => handleDelete(deal.id)} className="text-red-400 hover:text-red-300 text-sm">Удалить</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingDeal ? 'Изменить сделку' : 'Новая сделка'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Название *</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Сумма (₸)</label>
              <input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Этап</label>
              <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })} className="input-field">
                {stages.map((s) => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
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
            <label className="block text-sm font-medium text-dark-300 mb-2">Компания</label>
            <select value={form.company_id} onChange={(e) => setForm({ ...form, company_id: e.target.value })} className="input-field">
              <option value="">Без компании</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Заметки</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input-field" rows={3} />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Отмена</button>
            <button type="submit" className="btn-primary">{editingDeal ? 'Сохранить' : 'Создать'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
