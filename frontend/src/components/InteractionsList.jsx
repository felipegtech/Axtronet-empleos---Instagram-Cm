import { ChartIcon, InboxIcon } from './Icons'

function InteractionsList({ interactions, loading, onRefresh }) {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date
    
    // If less than a minute
    if (diff < 60000) return 'Ahora mismo'
    
    // If less than an hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000)
      return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`
    }
    
    // If today
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000)
      return `Hace ${hours} hora${hours > 1 ? 's' : ''}`
    }
    
    // Otherwise, show date
    return date.toLocaleString()
  }

  const getTypeIcon = (type) => {
    return type === 'comment' ? '💬' : '❤️'
  }

  const getTypeIconSVG = (type) => {
    if (type === 'comment') {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )
    }
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    )
  }

  const getTypeColor = (type) => {
    return type === 'comment' 
      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
      : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden border border-slate-200 dark:border-slate-700">
      <div className="bg-slate-800 dark:bg-slate-900 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white flex items-center">
            <ChartIcon className="w-5 h-5 mr-2" />
            Actividad Reciente
          </h2>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        {loading && interactions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 dark:border-blue-400 border-t-transparent"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-400 font-medium">Cargando interacciones...</p>
          </div>
        ) : interactions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-700/50">
                <InboxIcon className="w-12 h-12 text-slate-400 dark:text-slate-500" />
              </div>
            </div>
            <p className="text-slate-700 dark:text-slate-300 font-semibold text-lg">No hay interacciones aún</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
              Envía una solicitud webhook para ver interacciones aquí
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Mensaje
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Tiempo
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {interactions.map((interaction) => (
                <tr key={interaction._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold ${getTypeColor(interaction.type)}`}>
                      <span className="mr-1.5">{getTypeIconSVG(interaction.type)}</span>
                      {interaction.type === 'comment' ? 'Comentario' : 'Reacción'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-900 dark:text-slate-100 max-w-md truncate font-medium">
                      {interaction.message}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-600 dark:bg-blue-700 flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">
                          {interaction.user.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          @{interaction.user}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400 font-medium">
                    {formatTime(interaction.timestamp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      {interactions.length > 0 && (
        <div className="bg-slate-50 dark:bg-slate-700/50 px-6 py-4 text-sm text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 font-medium">
          Mostrando {interactions.length} interacciones más recientes
        </div>
      )}
    </div>
  )
}

export default InteractionsList

