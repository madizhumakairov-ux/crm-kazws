import { useState, useEffect } from 'react';
import api from '../api';
import Modal from '../components/Modal';

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', position: '', company_id: '', tags: '', notes: '' });

  useEffect(() => {
    loadContacts();
    loadCompanies();
  }, []);

  const loadContacts = async () => {
    try {
      const res = await api.get('/contacts', { params: { search } });
      setContacts(res.data);
    } catch (err) {
      console.error('Failed to load contacts:', err);
    } finally {
      setLoading(false);
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

  const handleSearch = (e) => {
    e.preventDefault();
    loadContacts();
  };

  const openCreateModal = () => {
    setEditingContact(null);
    setForm({ first_name: '', last_name: '', email: '', phone: '', position: '', company_id: '', tags: '', notes: '' });
    setShowModal(true);
  };

  const openEditModal = (contact) => {
    setEditingContact(contact);
    setForm({
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email || '',
      phone: contact.phone || '',
      position: contact.position || '',
      company_id: contact.company_id || '',
      tags: contact.tags ? JSON.parse(contact.tags).join(', ') : '',
      notes: contact.notes || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        company_id: form.company_id || null,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      };

      if (editingContact) {
        await api.put(`/contacts/${editingContact.id}`, payload);
      } else {
        await api.post('/contacts', payload);
      }
      setShowModal(false);
      loadContacts();
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка сохранения');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить контакт?')) return;
    try {
      await api.delete(`/contacts/${id}`);
      loadContacts();
    } catch (err) {
      alert('Ошибка удаления');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark-100">Контакты</h1>
        <button onClick={openCreateModal} className="btn-primary">
          + Добавить контакт
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по имени, email..."
          className="input-field flex-1"
        />
        <button type="submit" className="btn-secondary">Найти</button>
      </form>

      {/* Table */}
      {loading ? (
        <div className="text-center py-8 text-dark-400">Загрузка...</div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="text-left p-4 text-dark-400 text-sm font-medium">Имя</th>
                  <th className="text-left p-4 text-dark-400 text-sm font-medium">Email</th>
                  <th className="text-left p-4 text-dark-400 text-sm font-medium">Телефон</th>
                  <th className="text-left p-4 text-dark-400 text-sm font-medium">Должность</th>
                  <th className="text-left p-4 text-dark-400 text-sm font-medium">Компания</th>
                  <th className="text-left p-4 text-dark-400 text-sm font-medium">Теги</th>
                  <th className="text-left p-4 text-dark-400 text-sm font-medium">Взаимодействия</th>
                  <th className="text-right p-4 text-dark-400 text-sm font-medium">Действия</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact) => (
                  <tr key={contact.id} className="border-b border-dark-700/50 hover:bg-dark-800/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-500/20 rounded-full flex items-center justify-center text-primary-400 text-sm font-bold">
                          {contact.first_name[0]}{contact.last_name[0]}
                        </div>
                        <span className="text-dark-100 font-medium">{contact.first_name} {contact.last_name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-dark-300 text-sm">{contact.email || '—'}</td>
                    <td className="p-4 text-dark-300 text-sm">{contact.phone || '—'}</td>
                    <td className="p-4 text-dark-300 text-sm">{contact.position || '—'}</td>
                    <td className="p-4 text-dark-300 text-sm">{contact.company_name || '—'}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {contact.tags && JSON.parse(contact.tags).map((tag, i) => (
                          <span key={i} className="text-xs bg-primary-500/10 text-primary-400 px-2 py-1 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-dark-300 text-sm">{contact.interaction_count}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => openEditModal(contact)} className="text-primary-400 hover:text-primary-300 text-sm mr-3">Изменить</button>
                      <button onClick={() => handleDelete(contact.id)} className="text-red-400 hover:text-red-300 text-sm">Удалить</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {contacts.length === 0 && (
            <div className="text-center py-8 text-dark-500">Контакты не найдены</div>
          )}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingContact ? 'Изменить контакт' : 'Новый контакт'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Имя *</label>
              <input type="text" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Фамилия *</label>
              <input type="text" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="input-field" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Телефон</label>
            <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Должность</label>
            <input type="text" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className="input-field" />
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
            <label className="block text-sm font-medium text-dark-300 mb-2">Теги (через запятую)</label>
            <input type="text" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="input-field" placeholder="vip, decision-maker" />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Заметки</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input-field" rows={3} />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Отмена</button>
            <button type="submit" className="btn-primary">{editingContact ? 'Сохранить' : 'Создать'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
