import { useState, useEffect } from 'react';
import api from '../api';
import Modal from '../components/Modal';

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [form, setForm] = useState({ name: '', industry: '', website: '', phone: '', email: '', address: '', notes: '' });

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const res = await api.get('/companies', { params: { search } });
      setCompanies(res.data);
    } catch (err) {
      console.error('Failed to load companies:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadCompanies();
  };

  const openCreateModal = () => {
    setEditingCompany(null);
    setForm({ name: '', industry: '', website: '', phone: '', email: '', address: '', notes: '' });
    setShowModal(true);
  };

  const openEditModal = (company) => {
    setEditingCompany(company);
    setForm({
      name: company.name,
      industry: company.industry || '',
      website: company.website || '',
      phone: company.phone || '',
      email: company.email || '',
      address: company.address || '',
      notes: company.notes || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCompany) {
        await api.put(`/companies/${editingCompany.id}`, form);
      } else {
        await api.post('/companies', form);
      }
      setShowModal(false);
      loadCompanies();
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка сохранения');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить компанию?')) return;
    try {
      await api.delete(`/companies/${id}`);
      loadCompanies();
    } catch (err) {
      alert('Ошибка удаления');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark-100">Компании</h1>
        <button onClick={openCreateModal} className="btn-primary">
          + Добавить компанию
        </button>
      </div>

      <form onSubmit={handleSearch} className="flex gap-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по названию, отрасли..."
          className="input-field flex-1"
        />
        <button type="submit" className="btn-secondary">Найти</button>
      </form>

      {loading ? (
        <div className="text-center py-8 text-dark-400">Загрузка...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((company) => (
            <div key={company.id} className="card hover:border-dark-600 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-primary-500/10 rounded-xl flex items-center justify-center text-xl">
                  🏢
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEditModal(company)} className="text-primary-400 hover:text-primary-300 text-sm">Изменить</button>
                  <button onClick={() => handleDelete(company.id)} className="text-red-400 hover:text-red-300 text-sm">Удалить</button>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-dark-100 mb-1">{company.name}</h3>
              {company.industry && <p className="text-sm text-primary-400 mb-3">{company.industry}</p>}
              <div className="space-y-2 text-sm text-dark-400">
                {company.email && <p>📧 {company.email}</p>}
                {company.phone && <p>📞 {company.phone}</p>}
                {company.website && <p>🌐 {company.website}</p>}
                {company.address && <p>📍 {company.address}</p>}
              </div>
              <div className="flex gap-4 mt-4 pt-4 border-t border-dark-700">
                <span className="text-xs text-dark-500">👥 {company.contact_count} контактов</span>
                <span className="text-xs text-dark-500">💰 {company.deal_count} сделок</span>
              </div>
            </div>
          ))}
          {companies.length === 0 && (
            <div className="col-span-full text-center py-8 text-dark-500">Компании не найдены</div>
          )}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingCompany ? 'Изменить компанию' : 'Новая компания'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Название *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Отрасль</label>
            <input type="text" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Сайт</label>
            <input type="text" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Телефон</label>
              <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Адрес</label>
            <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Заметки</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input-field" rows={3} />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Отмена</button>
            <button type="submit" className="btn-primary">{editingCompany ? 'Сохранить' : 'Создать'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
