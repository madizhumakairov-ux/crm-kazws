import { useState, useEffect } from 'react';
import api from '../api';

const stageLabels = { new: 'Новый', qualified: 'Квалифицирован', proposal: 'КП отправлено', negotiation: 'Переговоры', won: 'Выиграна', lost: 'Проиграна' };
const stageColors = {
  new: 'bg-blue-500', qualified: 'bg-yellow-500', proposal: 'bg-purple-500',
  negotiation: 'bg-orange-500', won: 'bg-green-500', lost: 'bg-red-500',
};

function BarChart({ data, maxValue, labelKey, valueKey, colorFn }) {
  return (
    <div className="space-y-3">
      {data.map((item, i) => (
        <div key={i}>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-dark-300">{item[labelKey]}</span>
            <span className="text-dark-400">{Number(item[valueKey]).toLocaleString('ru-RU')} ₸</span>
          </div>
          <div className="h-3 bg-dark-700 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${colorFn ? colorFn(item) : 'bg-primary-500'}`}
              style={{ width: `${maxValue > 0 ? (item[valueKey] / maxValue) * 100 : 0}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function StatCard({ title, value, subtitle, color = 'text-primary-400' }) {
  return (
    <div className="bg-dark-800 border border-dark-700 rounded-xl p-5">
      <p className="text-sm text-dark-400 mb-1">{title}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {subtitle && <p className="text-xs text-dark-500 mt-1">{subtitle}</p>}
    </div>
  );
}

export default function Reports() {
  const [dashboard, setDashboard] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [dealsByStage, setDealsByStage] = useState([]);
  const [topContacts, setTopContacts] = useState([]);
  const [conversion, setConversion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    try {
      const [d, r, dbs, tc, conv] = await Promise.all([
        api.get('/reports/dashboard'),
        api.get('/reports/revenue'),
        api.get('/reports/deals-by-stage'),
        api.get('/reports/top-contacts'),
        api.get('/reports/conversion'),
      ]);
      setDashboard(d.data);
      setRevenue(r.data);
      setDealsByStage(dbs.data);
      setTopContacts(tc.data);
      setConversion(conv.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-dark-400">Загрузка...</div>;

  const maxRevenue = Math.max(...revenue.map(r => r.total), 1);
  const maxStageValue = Math.max(...dealsByStage.map(d => d.total_value), 1);
  const maxContactValue = Math.max(...topContacts.map(c => c.total_value), 1);

  return (
    <div>
      <h1 className="text-2xl font-bold text-dark-100 mb-6">Отчёты и аналитика</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Всего контактов" value={dashboard?.totalContacts || 0} />
        <StatCard title="Активные сделки" value={dashboard?.activeDeals || 0} color="text-yellow-400" />
        <StatCard title="Выручка (выигранные)" value={`${((dashboard?.totalRevenue || 0) / 1000000).toFixed(1)} млн ₸`} color="text-green-400" />
        <StatCard title="Задачи на неделю" value={dashboard?.tasksDue || 0} color="text-orange-400" />
      </div>

      {/* Conversion */}
      {conversion && (
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-dark-200 mb-4">Конверсия сделок</h2>
          <div className="flex items-center gap-8">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary-400">{conversion.rate}%</p>
              <p className="text-xs text-dark-500">Конверсия</p>
            </div>
            <div className="flex-1">
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-dark-600" />
                  <span className="text-dark-400">Всего: {conversion.total}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-dark-400">Выиграно: {conversion.won}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-dark-400">Проиграно: {conversion.lost}</span>
                </div>
              </div>
              <div className="mt-3 h-4 bg-dark-700 rounded-full overflow-hidden flex">
                {conversion.total > 0 && (
                  <>
                    <div className="bg-green-500 h-full" style={{ width: `${(conversion.won / conversion.total) * 100}%` }} />
                    <div className="bg-red-500 h-full" style={{ width: `${(conversion.lost / conversion.total) * 100}%` }} />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue by month */}
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-dark-200 mb-4">Выручка по месяцам</h2>
          {revenue.length === 0 ? (
            <p className="text-dark-500 text-sm">Нет данных</p>
          ) : (
            <BarChart data={revenue} maxValue={maxRevenue} labelKey="month" valueKey="total" />
          )}
        </div>

        {/* Deals by stage */}
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-dark-200 mb-4">Сделки по этапам</h2>
          {dealsByStage.length === 0 ? (
            <p className="text-dark-500 text-sm">Нет данных</p>
          ) : (
            <div className="space-y-3">
              {dealsByStage.map((item) => (
                <div key={item.stage}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-dark-300">{stageLabels[item.stage] || item.stage}</span>
                    <span className="text-dark-400">{item.count} шт · {Number(item.total_value).toLocaleString('ru-RU')} ₸</span>
                  </div>
                  <div className="h-3 bg-dark-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${stageColors[item.stage] || 'bg-gray-500'}`}
                      style={{ width: `${maxStageValue > 0 ? (item.total_value / maxStageValue) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top contacts */}
      <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-dark-200 mb-4">Топ-10 контактов по сумме сделок</h2>
        {topContacts.length === 0 ? (
          <p className="text-dark-500 text-sm">Нет данных</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="text-left py-3 px-4 text-dark-400 font-medium">#</th>
                  <th className="text-left py-3 px-4 text-dark-400 font-medium">Контакт</th>
                  <th className="text-left py-3 px-4 text-dark-400 font-medium">Email</th>
                  <th className="text-right py-3 px-4 text-dark-400 font-medium">Сделок</th>
                  <th className="text-right py-3 px-4 text-dark-400 font-medium">Сумма</th>
                </tr>
              </thead>
              <tbody>
                {topContacts.map((c, i) => (
                  <tr key={c.id} className="border-b border-dark-700/50 hover:bg-dark-700/30">
                    <td className="py-3 px-4 text-dark-500">{i + 1}</td>
                    <td className="py-3 px-4 text-dark-200 font-medium">{c.name}</td>
                    <td className="py-3 px-4 text-dark-400">{c.email || '—'}</td>
                    <td className="py-3 px-4 text-dark-300 text-right">{c.deal_count}</td>
                    <td className="py-3 px-4 text-green-400 text-right font-medium">{Number(c.total_value).toLocaleString('ru-RU')} ₸</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
