import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { ChartBarIcon, CommentIcon, HeartIcon, EnvelopeIcon, ClockIcon } from './Icons'

function Stats({ stats }) {
  const statCards = [
    {
      title: 'Total de Interacciones',
      value: stats?.total || 0,
      icon: ChartBarIcon,
      color: 'bg-blue-600',
      iconColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Comentarios',
      value: stats?.comments || 0,
      icon: CommentIcon,
      color: 'bg-green-600',
      iconColor: 'text-green-600 dark:text-green-400'
    },
    {
      title: 'Reacciones',
      value: stats?.reactions || 0,
      icon: HeartIcon,
      color: 'bg-red-600',
      iconColor: 'text-red-600 dark:text-red-400'
    },
    {
      title: 'DMs Enviados',
      value: stats?.dmsSent || 0,
      icon: EnvelopeIcon,
      color: 'bg-purple-600',
      iconColor: 'text-purple-600 dark:text-purple-400'
    },
    {
      title: 'Últimas 24 Horas',
      value: stats?.last24Hours || 0,
      icon: ClockIcon,
      color: 'bg-amber-600',
      iconColor: 'text-amber-600 dark:text-amber-400'
    }
  ]

  const sentimentData = stats?.sentiment ? [
    { name: 'Positivo', value: stats.sentiment.positive || 0, color: '#10b981' },
    { name: 'Neutral', value: stats.sentiment.neutral || 0, color: '#6b7280' },
    { name: 'Negativo', value: stats.sentiment.negative || 0, color: '#ef4444' }
  ].filter(item => item.value > 0) : []

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
        {statCards.map((stat, index) => {
          const IconComponent = stat.icon
          return (
            <div 
              key={index}
              className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 border border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 group-hover:bg-slate-100 dark:group-hover:bg-slate-700 transition-colors group-hover:scale-105`}>
                  <IconComponent className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
                <div className={`${stat.color} w-1 h-12 rounded-full opacity-60 group-hover:opacity-100 group-hover:h-14 transition-all`}></div>
              </div>
              <div className="text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wider">
                {stat.title}
              </div>
              <div className="flex items-baseline space-x-2">
                <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {stat.value.toLocaleString()}
                </div>
                {stat.value > 0 && (
                  <div className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                    {stat.value === 1 ? 'interacción' : 'interacciones'}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {sentimentData.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-8 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <CommentIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Análisis de Sentimiento</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={sentimentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {sentimentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

export default Stats

