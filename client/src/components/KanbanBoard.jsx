import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function KanbanBoard({ deals, onStageChange, onRefresh }) {
  const navigate = useNavigate();
  const [stages, setStages] = useState([]);
  const [draggedDeal, setDraggedDeal] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);
  const [loading, setLoading] = useState(true);

  // Stage management
  const [showStageModal, setShowStageModal] = useState(false);
  const [editingStage, setEditingStage] = useState(null);
  const [stageForm, setStageForm] = useState({ name: '', color: '#3B82F6' });
  const [showColumnMenu, setShowColumnMenu] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [moveToStage, setMoveToStage] = useState('');

  // Add stage inline
  const [showAddStage, setShowAddStage] = useState(false);
  const [newStageName, setNewStageName] = useState('');

  useEffect(() => {
    loadStages();
  }, []);

  const loadStages = async () => {
    try {
      const res = await api.get('/stages');
      setStages(res.data);
    } catch (err) {
      console.error('Failed to load stages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e, deal) => {
    setDraggedDeal(deal);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, stageName) => {
    e.preventDefault();
    setDragOverStage(stageName);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = (e, stageName) => {
    e.preventDefault();
    setDragOverStage(null);
    if (draggedDeal && draggedDeal.stage !== stageName) {
      onStageChange(draggedDeal.id, stageName);
    }
    setDraggedDeal(null);
  };

  const formatValue = (value) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M ₸`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K ₸`;
    return `${value} ₸`;
  };

  const handleAddStage = async () => {
    if (!newStageName.trim()) return;
    try {
      await api.post('/stages', { name: newStageName.trim() });
      setNewStageName('');
      setShowAddStage(false);
      loadStages();
    } catch (err) {
      alert('Ошибка добавления этапа');
    }
  };

  const handleRenameStage = async (stageId) => {
    if (!stageForm.name.trim()) return;
    try {
      await api.put(`/stages/${stageId}`, { name: stageForm.name.trim(), color: stageForm.color });
      setEditingStage(null);
      loadStages();
      if (onRefresh) onRefresh();
    } catch (err) {
      alert('Ошибка переименования');
    }
  };

  const handleChangeColor = async (stageId, color) => {
    const stage = stages.find((s) => s.id === stageId);
    if (!stage) return;
    try {
      await api.put(`/stages/${stageId}`, { name: stage.name, color });
      loadStages();
    } catch (err) {
      alert('Ошибка изменения цвета');
    }
  };

  const handleDeleteStage = async (stageId) => {
    const stage = stages.find((s) => s.id === stageId);
    if (!stage) return;

    const dealsInStage = deals.filter((d) => d.stage === stage.name);
    if (dealsInStage.length > 0) {
      setShowDeleteConfirm(stageId);
      setMoveToStage('');
    } else {
      if (confirm(`Удалить этап "${stage.name}"?`)) {
        try {
          await api.delete(`/stages/${stageId}`);
          loadStages();
          if (onRefresh) onRefresh();
        } catch (err) {
          alert('Ошибка удаления');
        }
      }
    }
  };

  const confirmDeleteStage = async () => {
    if (!showDeleteConfirm) return;
    const stage = stages.find((s) => s.id === showDeleteConfirm);
    if (!stage) return;

    try {
      const params = moveToStage ? `?move_to=${moveToStage}` : '';
      await api.delete(`/stages/${showDeleteConfirm}${params}`);
      setShowDeleteConfirm(null);
      setMoveToStage('');
      loadStages();
      if (onRefresh) onRefresh();
    } catch (err) {
      alert('Ошибка удаления');
    }
  };

  const openEditStage = (stage) => {
    setEditingStage(stage.id);
    setStageForm({ name: stage.name, color: stage.color });
    setShowColumnMenu(null);
  };

  if (loading) {
    return <div className="text-center py-8 text-dark-400">Загрузка этапов...</div>;
  }

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage === stage.name);
          const stageTotal = stageDeals.reduce((sum, d) => sum + d.value, 0);

          return (
            <div
              key={stage.id}
              className={`flex-shrink-0 w-72 bg-dark-900 rounded-xl border transition-colors ${
                dragOverStage === stage.name ? 'border-primary-500 bg-dark-800' : 'border-dark-700'
              }`}
              onDragOver={(e) => handleDragOver(e, stage.name)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.name)}
            >
              <div className="p-4 border-b border-dark-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {editingStage === stage.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="color"
                          value={stageForm.color}
                          onChange={(e) => setStageForm({ ...stageForm, color: e.target.value })}
                          className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                        />
                        <input
                          type="text"
                          value={stageForm.name}
                          onChange={(e) => setStageForm({ ...stageForm, name: e.target.value })}
                          className="bg-dark-800 border border-dark-600 rounded px-2 py-1 text-sm text-dark-100 w-28"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameStage(stage.id);
                            if (e.key === 'Escape') setEditingStage(null);
                          }}
                        />
                        <button
                          onClick={() => handleRenameStage(stage.id)}
                          className="text-green-400 hover:text-green-300 text-xs"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => setEditingStage(null)}
                          className="text-dark-400 hover:text-dark-200 text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <>
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: stage.color }}
                        />
                        <h3 className="font-medium text-dark-200 text-sm">{stage.name}</h3>
                        <div className="relative">
                          <button
                            onClick={() =>
                              setShowColumnMenu(showColumnMenu === stage.id ? null : stage.id)
                            }
                            className="text-dark-500 hover:text-dark-300 text-xs ml-1 px-1"
                          >
                            ⋯
                          </button>
                          {showColumnMenu === stage.id && (
                            <div className="absolute left-0 top-6 z-20 bg-dark-800 border border-dark-600 rounded-lg shadow-lg py-1 min-w-[140px]">
                              <button
                                onClick={() => openEditStage(stage)}
                                className="w-full text-left px-3 py-2 text-sm text-dark-200 hover:bg-dark-700"
                              >
                                ✏️ Переименовать
                              </button>
                              <div className="px-3 py-2 flex items-center gap-2">
                                <span className="text-sm text-dark-400">🎨</span>
                                <input
                                  type="color"
                                  value={stage.color}
                                  onChange={(e) => handleChangeColor(stage.id, e.target.value)}
                                  className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                                />
                                <span className="text-sm text-dark-400">Цвет</span>
                              </div>
                              <button
                                onClick={() => {
                                  handleDeleteStage(stage.id);
                                  setShowColumnMenu(null);
                                }}
                                className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-dark-700"
                              >
                                🗑️ Удалить
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  <span className="text-xs text-dark-400 bg-dark-800 px-2 py-1 rounded-full">
                    {stageDeals.length}
                  </span>
                </div>
                <p className="text-xs text-dark-500 mt-1">{formatValue(stageTotal)}</p>
              </div>

              <div className="p-3 space-y-3 min-h-[200px]">
                {stageDeals.map((deal) => (
                  <div
                    key={deal.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, deal)}
                    onClick={() => navigate(`/deals/${deal.id}`)}
                    className={`bg-dark-800 border border-dark-600 rounded-lg p-4 cursor-grab active:cursor-grabbing hover:border-primary-500/50 hover:shadow-lg transition-all ${
                      draggedDeal?.id === deal.id ? 'opacity-50 scale-95' : ''
                    }`}
                  >
                    <h4 className="font-medium text-dark-100 text-sm mb-2">{deal.title}</h4>
                    <p className="text-primary-400 font-semibold text-sm mb-2">
                      {formatValue(deal.value)}
                    </p>
                    {deal.contact_name && (
                      <p className="text-xs text-dark-400">👤 {deal.contact_name}</p>
                    )}
                    {deal.company_name && (
                      <p className="text-xs text-dark-400">🏢 {deal.company_name}</p>
                    )}
                  </div>
                ))}
                {stageDeals.length === 0 && (
                  <div className="text-center py-8 text-dark-500 text-sm">Нет сделок</div>
                )}
              </div>
            </div>
          );
        })}

        {/* Add new stage column */}
        <div className="flex-shrink-0 w-72">
          {showAddStage ? (
            <div className="bg-dark-900 rounded-xl border border-dark-700 p-4 space-y-3">
              <input
                type="text"
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
                placeholder="Название этапа"
                className="input-field text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddStage();
                  if (e.key === 'Escape') {
                    setShowAddStage(false);
                    setNewStageName('');
                  }
                }}
              />
              <div className="flex gap-2">
                <button onClick={handleAddStage} className="btn-primary text-sm flex-1">
                  Добавить
                </button>
                <button
                  onClick={() => {
                    setShowAddStage(false);
                    setNewStageName('');
                  }}
                  className="btn-secondary text-sm"
                >
                  Отмена
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddStage(true)}
              className="w-full h-[120px] bg-dark-900/50 border-2 border-dashed border-dark-700 rounded-xl flex items-center justify-center text-dark-500 hover:text-dark-300 hover:border-dark-500 transition-colors"
            >
              <span className="text-2xl mr-2">+</span>
              <span className="text-sm">Добавить этап</span>
            </button>
          )}
        </div>
      </div>

      {/* Delete stage confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/60" onClick={() => setShowDeleteConfirm(null)} />
          <div className="relative bg-dark-800 border border-dark-600 rounded-xl w-full max-w-md mx-4 p-6 space-y-4">
            <h3 className="text-lg font-semibold text-dark-100">Удалить этап?</h3>
            <p className="text-dark-400 text-sm">
              В этом этапе есть сделки. Куда переместить?
            </p>
            <select
              value={moveToStage}
              onChange={(e) => setMoveToStage(e.target.value)}
              className="input-field"
            >
              <option value="">Не перемещать (удалить связи)</option>
              {stages
                .filter((s) => s.id !== showDeleteConfirm)
                .map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
            </select>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="btn-secondary">
                Отмена
              </button>
              <button onClick={confirmDeleteStage} className="btn-danger">
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close column menu */}
      {showColumnMenu && (
        <div className="fixed inset-0 z-10" onClick={() => setShowColumnMenu(null)} />
      )}
    </>
  );
}
