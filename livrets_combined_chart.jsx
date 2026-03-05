import React, { useState } from 'react';
import {
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Eye, EyeOff } from 'lucide-react';

// Data combining all livrets
const allLivretsData = [
  {
    month: 'Jan',
    'Bourso+': 0.2,
    'Mon Livret': -0.1,
    'LDDS': 0.0,
  },
  {
    month: 'Fev',
    'Bourso+': 0.3,
    'Mon Livret': 0.0,
    'LDDS': 0.0,
  },
  {
    month: 'Mar',
    'Bourso+': 0.4,
    'Mon Livret': 0.05,
    'LDDS': 0.0,
  },
  {
    month: 'Avr',
    'Bourso+': 0.5,
    'Mon Livret': 0.08,
    'LDDS': 0.05,
  },
  {
    month: 'Mai',
    'Bourso+': 0.6,
    'Mon Livret': 0.12,
    'LDDS': 0.08,
  },
  {
    month: 'Jun',
    'Bourso+': 0.65,
    'Mon Livret': 0.15,
    'LDDS': 0.10,
  },
  {
    month: 'Jul',
    'Bourso+': 0.68,
    'Mon Livret': 0.18,
    'LDDS': 0.12,
  },
  {
    month: 'Aug',
    'Bourso+': 0.72,
    'Mon Livret': 0.20,
    'LDDS': 0.15,
  },
  {
    month: 'Sep',
    'Bourso+': 0.75,
    'Mon Livret': 0.22,
    'LDDS': 0.18,
  },
  {
    month: 'Oct',
    'Bourso+': 0.78,
    'Mon Livret': 0.25,
    'LDDS': 0.20,
  },
  {
    month: 'Nov',
    'Bourso+': 0.8,
    'Mon Livret': 0.27,
    'LDDS': 0.22,
  },
  {
    month: 'Dec',
    'Bourso+': 0.85,
    'Mon Livret': 0.30,
    'LDDS': 0.25,
  },
];

// Livrets configuration
const livretsConfig = {
  'Bourso+': {
    color: '#10b981',
    accentColor: '#059669',
    solde: '626€',
    type: 'Livret rémunéré',
  },
  'Mon Livret': {
    color: '#06b6d4',
    accentColor: '#0891b2',
    solde: '11€',
    type: 'Livret rémunéré',
  },
  'LDDS': {
    color: '#8b5cf6',
    accentColor: '#7c3aed',
    solde: '12€',
    type: 'Livret rémunéré',
  },
};

// Custom tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black border-2 border-[#f1c086] rounded-lg p-4 shadow-lg">
        <p className="text-[#f1c086] font-semibold mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span style={{ color: entry.color }} className="text-sm font-medium">
              {entry.name}: {entry.value.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Main Component
export default function LivretsCombinedChart() {
  const [visibleLivrets, setVisibleLivrets] = useState({
    'Bourso+': true,
    'Mon Livret': true,
    'LDDS': true,
  });

  const toggleLivret = (livret) => {
    setVisibleLivrets((prev) => ({
      ...prev,
      [livret]: !prev[livret],
    }));
  };

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">Performance Globale Livrets</h1>
          <p className="text-gray-400">Comparatif mensuel de toutes les enveloppes</p>
        </div>

        {/* Main Chart Card */}
        <div className="bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a] rounded-2xl p-8 border border-[#f1c086]/20 mb-12">
          {/* Toggle Buttons */}
          <div className="flex flex-wrap gap-3 mb-8">
            {Object.entries(livretsConfig).map(([livret, config]) => (
              <button
                key={livret}
                onClick={() => toggleLivret(livret)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all border-2"
                style={{
                  backgroundColor: visibleLivrets[livret] ? `${config.color}20` : '#1a1a1a',
                  borderColor: config.color,
                  color: visibleLivrets[livret] ? config.color : '#666',
                }}
              >
                {visibleLivrets[livret] ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
                {livret}
              </button>
            ))}
          </div>

          {/* Chart */}
          <ResponsiveContainer width="100%" height={450}>
            <ComposedChart
              data={allLivretsData}
              margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
            >
              <defs>
                <linearGradient id="gradient-boursoplus" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradient-monlivret" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradient-ldds" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis
                dataKey="month"
                stroke="#666"
                style={{ fontSize: '12px' }}
                tick={{ fill: '#999' }}
              />
              <YAxis
                stroke="#666"
                style={{ fontSize: '12px' }}
                tick={{ fill: '#999' }}
                label={{ value: 'Performance (%)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="line"
                formatter={(value) => <span style={{ color: '#fff' }}>{value}</span>}
              />

              {visibleLivrets['Bourso+'] && (
                <Area
                  type="monotone"
                  dataKey="Bourso+"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#gradient-boursoplus)"
                  isAnimationActive={true}
                />
              )}
              {visibleLivrets['Mon Livret'] && (
                <Area
                  type="monotone"
                  dataKey="Mon Livret"
                  stroke="#06b6d4"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#gradient-monlivret)"
                  isAnimationActive={true}
                />
              )}
              {visibleLivrets['LDDS'] && (
                <Area
                  type="monotone"
                  dataKey="LDDS"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#gradient-ldds)"
                  isAnimationActive={true}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          {Object.entries(livretsConfig).map(([livret, config]) => {
            const data = allLivretsData.map((d) => d[livret]);
            const maxPerf = Math.max(...data);
            const minPerf = Math.min(...data);
            const avgPerf = (data.reduce((a, b) => a + b, 0) / data.length).toFixed(2);

            return (
              <div
                key={livret}
                className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] rounded-xl p-6 border-2"
                style={{ borderColor: `${config.color}40` }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: config.color }}
                  />
                  <div>
                    <h3 className="text-white font-bold">{livret}</h3>
                    <p className="text-gray-500 text-xs">{config.type}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <span className="text-gray-400 text-sm">Solde</span>
                    <span style={{ color: config.color }} className="text-xl font-bold">
                      {config.solde}
                    </span>
                  </div>

                  <div className="border-t border-[#333] pt-3">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Max</p>
                        <p style={{ color: config.color }} className="font-bold text-sm">
                          +{maxPerf.toFixed(2)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Moy</p>
                        <p style={{ color: config.color }} className="font-bold text-sm">
                          +{avgPerf}%
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Min</p>
                        <p style={{ color: config.color }} className="font-bold text-sm">
                          {minPerf >= 0 ? '+' : ''}{minPerf.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Insights */}
        <div className="bg-gradient-to-r from-[#1a1a1a] to-[#0a0a0a] rounded-xl p-6 border border-[#f1c086]/20">
          <h3 className="text-[#f1c086] font-bold mb-4">📊 Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-300">
            <div>
              <p className="text-white font-semibold mb-2">🏆 Meilleur Performer</p>
              <p><span style={{ color: '#10b981' }}>Bourso+</span> avec +0.85% en décembre (impact des taux hauts)</p>
            </div>
            <div>
              <p className="text-white font-semibold mb-2">📈 Trend</p>
              <p>Tous les livrets affichent une croissance progressive. Le rendement s'améliore au fil des mois.</p>
            </div>
            <div>
              <p className="text-white font-semibold mb-2">💡 Conseil</p>
              <p>La différence de performance dépend du taux appliqué et du solde. À surveiller trimestriellement.</p>
            </div>
          </div>
        </div>

        {/* Feature Actions */}
        <div className="mt-12 flex gap-4 justify-center">
          <button className="px-6 py-3 bg-[#f1c086] text-black font-bold rounded-lg hover:bg-[#f1c086]/90 transition-all">
            Exporter en PDF
          </button>
          <button className="px-6 py-3 bg-[#1a1a1a] text-white border-2 border-[#f1c086] font-bold rounded-lg hover:bg-[#222] transition-all">
            Voir la Projection
          </button>
        </div>
      </div>
    </div>
  );
}
