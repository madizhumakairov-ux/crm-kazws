import { useState } from 'react';

const STAGES = [
  { id: 'new', label: 'Новые', color: 'bg-blue-500' },
  { id: 'qualified', label: 'Квалифицированные', color: 'bg-purple-500' },
  { id: 'proposal', label: 'Предложение', color: 'bg-yellow-500' },
  { id: 'negotiation', label: 'Переговоры', color: 'bg-orange-500' },
  { id: 'won', label: 'Выигранные', color: 'bg-green-500' },
  { id: 'lost', label: 'Проигранные', color: 'bg-red-500' },
];

export default function KanbanBoard({ deals, onStageChange }) {
  const [draggedDeal, setDraggedDeal] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);

  const handleDragStart = (e, deal) => {
    setDraggedDeal(deal);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, stageId) => {
    e.preventDefault();
    setDragOverStage(stageId);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = (e, stageId) => {
    e.preventDefault();
    setDragOverStage(null);
    if (draggedDeal && draggedDeal.stage !== stageId) {
      onStageChange(draggedDeal.id, stageId);
    }
    setDraggedDeal(null);
  };

  const formatValue = (value) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M ₸`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K ₸`;
    return `${value} ₸`;
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {STAGES.map((stage) => {
        const stageDeals = deals.filter((d) => d.stage === stage.id);
        const stageTotal = stageDeals.reduce((sum, d) => sum + d.value, 0);

        return (
          <div
            key={stage.id}
            className={`flex-shrink-0 w-72 bg-dark-900 rounded-xl border transition-colors ${
              dragOverStage === stage.id ? 'border-primary-500 bg-dark-800' : 'border-dark-700'
            }`}
            onDragOver={(e) => handleDragOver(e, stage.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, stage.id)}
          >
            <div className="p-4 border-b border-dark-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                  <h3 className="font-medium text-dark-200 text-sm">{stage.label}</h3>
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
                  className={`bg-dark-800 border border-dark-600 rounded-lg p-4 cursor-grab active:cursor-grabbing hover:border-dark-500 transition-all ${
                    draggedDeal?.id === deal.id ? 'opacity-50 scale-95' : ''
                  }`}
                >
                  <h4 className="font-medium text-dark-100 text-sm mb-2">{deal.title}</h4>
                  <p className="text-primary-400 font-semibold text-sm mb-2">{formatValue(deal.value)}</p>
                  {deal.contact_name && (
                    <p className="text-xs text-dark-400">👤 {deal.contact_name}</p>
                  )}
                  {deal.company_name && (
                    <p className="text-xs text-dark-400">🏢 {deal.company_name}</p>
                  )}
                </div>
              ))}
              {stageDeals.length === 0 && (
                <div className="text-center py-8 text-dark-500 text-sm">
                  Нет сделок
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
