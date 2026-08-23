import { useState, useEffect } from 'react';
import api from '../api';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await api.get('/reports/dashboard');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-dark-400">Загрузка...</div>;
  }

  if (!data) {
    return <div className="flex items-center justify-center h-64 text-dark-400">Ошибка загрузки данных</div>;
  }

  const formatValue = (value) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M ₸`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K ₸`;
    return `${value} ₸`;
  };

  const stageLabels = {
    new: 'Новые',
    qualified: 'Квалифицированные',
    proposal: 'Предложение',
    negotiation: 'Переговоры',
    won: 'Выигранные',
    lost: 'Проигранные',
  };

  const stageColors = {
    new: 'bg-blue-500',
    qualified: 'bg-purple-500',
    proposal: 'bg-yellow-500',
    negotiation: 'bg-orange-500',
    won: 'bg-green-500',
    lost: 'bg-red-500',
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-dark-100">Дашборд</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-400 text-sm">Всего контактов</p>
              <p className="text-3xl font-bold text-dark-100 mt-1">{data.totalContacts}</p>
            </div>
            <div className="w-12 h-12 bg-primary-500/10 rounded-xl flex items-center justify-center text-2xl">
              👥
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-400 text-sm">Активные сделки</p>
              <p className="text-3xl font-bold text-dark-100 mt-1">{data.activeDeals}</p>
            </div>
            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-2xl">
              💰
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-400 text-sm">Выручка</p>
              <p className="text-3xl font-bold text-dark-100 mt-1">{formatValue(data.totalRevenue)}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center text-2xl">
              📈
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-400 text-sm">Задачи на неделю</p>
              <p className="text-3xl font-bold text-dark-100 mt-1">{data.tasksDue}</p>
            </div>
            <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center text-2xl">
              ✅
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Summary */}
        <div className="card">
          <h3 className="text-lg font-semibold text-dark-100 mb-4">Воронка продаж</h3>
          <div className="space-y-3">
            {data.pipeline.map((item) => (
              <div key={item.stage} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${stageColors[item.stage]}`} />
                <div className="flex-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-300">{stageLabels[item.stage]}</span>
                    <span className="text-dark-400">{item.count} сделок</span>
                  </div>
                  <div className="mt-1 h-2 bg-dark-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${stageColors[item.stage]} rounded-full`}
                      style={{ width: `${Math.min((item.count / Math.max(...data.pipeline.map(p => p.count), 1)) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-dark-500 mt-1">{formatValue(item.total_value)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h3 className="text-lg font-semibold text-dark-100 mb-4">Последняя активность</h3>
          <div className="space-y-3">
            {data.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-dark-900 rounded-lg">
                <div className="w-8 h-8 bg-primary-500/10 rounded-full flex items-center justify-center text-sm">
                  💬
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-dark-200 truncate">{activity.title}</p>
                  <p className="text-xs text-dark-500 mt-1">
                    {activity.username} • {new Date(activity.date).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              </div>
            ))}
            {data.recentActivity.length === 0 && (
              <p className="text-dark-500 text-sm text-center py-4">Нет активности</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
