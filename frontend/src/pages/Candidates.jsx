import { useState, useEffect } from 'react'
import axios from 'axios'
import { CandidatesIcon } from '../components/Icons'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function Candidates() {
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [filters, setFilters] = useState({
    interestArea: '',
    reactionType: '',
    sentiment: '',
    status: ''
  })
  const [dmMessage, setDmMessage] = useState('')
  const [sendingDM, setSendingDM] = useState(false)

  useEffect(() => {
    fetchCandidates()
  }, [filters])

  const fetchCandidates = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.interestArea) params.append('interestArea', filters.interestArea)
      if (filters.reactionType) params.append('reactionType', filters.reactionType)
      if (filters.sentiment) params.append('sentiment', filters.sentiment)
      if (filters.status) params.append('status', filters.status)

      const response = await axios.get(
        `${API_BASE_URL}/api/candidates?${params.toString()}`
      )
      setCandidates(response.data.data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching candidates:', error)
      setLoading(false)
    }
  }

  const handleInvite = async (candidateId) => {
    if (!dmMessage.trim()) {
      alert('Por favor ingresa un mensaje')
      return
    }

    try {
      await axios.post(`${API_BASE_URL}/api/candidates/${candidateId}/invite`, {
        message: dmMessage
      })
      setDmMessage('')
      setSelectedCandidate(null)
      fetchCandidates()
      alert('Invitation sent successfully!')
    } catch (error) {
      console.error('Error sending invitation:', error)
      alert('Error al enviar la invitación')
    }
  }

  const handleContinueDM = async (candidateId, message) => {
    if (!message || !message.trim()) {
      alert('Por favor ingresa un mensaje para continuar la conversación')
      return
    }

    setSendingDM(true)
    try {
      const response = await axios.post(`${API_BASE_URL}/api/candidates/${candidateId}/continue-dm`, {
        message: message
      })
      
      // Refresh candidate data to show updated conversation
      const candidateResponse = await axios.get(`${API_BASE_URL}/api/candidates/${candidateId}`)
      setSelectedCandidate(candidateResponse.data.data)
      setDmMessage('')
      fetchCandidates()
      alert('✅ Mensaje DM enviado exitosamente!')
    } catch (error) {
      console.error('Error sending DM:', error)
      const errorMsg = error.response?.data?.error || error.message || 'Error desconocido'
      alert(`❌ Error al enviar el DM: ${errorMsg}`)
    } finally {
      setSendingDM(false)
    }
  }

  const handleStatusChange = async (candidateId, newStatus) => {
    try {
      await axios.put(`${API_BASE_URL}/api/candidates/${candidateId}`, {
        status: newStatus
      })
      fetchCandidates()
      // Update selected candidate if it's the one being updated
      if (selectedCandidate && selectedCandidate._id === candidateId) {
        setSelectedCandidate({ ...selectedCandidate, status: newStatus })
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Error al actualizar el estado')
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      'new': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
      'contacted': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
      'interviewed': 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
      'hired': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      'rejected': 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
    }
    return colors[status] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
  }

  // Get last conversation message for quick reference
  const getLastConversation = (candidate) => {
    if (!candidate.conversations || candidate.conversations.length === 0) return null
    return candidate.conversations[candidate.conversations.length - 1]
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-slate-200 dark:border-slate-700">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center">
            <CandidatesIcon className="w-8 h-8 mr-3 text-blue-600 dark:text-blue-400" />
            Candidatos / Sección de Usuarios
          </h1>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Área de Interés
            </label>
            <select
              value={filters.interestArea}
              onChange={(e) => setFilters({ ...filters, interestArea: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos</option>
              <option value="development">Desarrollo</option>
              <option value="design">Diseño</option>
              <option value="marketing">Marketing</option>
              <option value="sales">Ventas</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Tipo de Reacción
            </label>
            <select
              value={filters.reactionType}
              onChange={(e) => setFilters({ ...filters, reactionType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos</option>
              <option value="like">❤️ Me gusta</option>
              <option value="love">😍 Me encanta</option>
              <option value="haha">😂 Jajaja</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Sentimiento
            </label>
            <select
              value={filters.sentiment}
              onChange={(e) => setFilters({ ...filters, sentiment: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos</option>
              <option value="positive">Positivo</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negativo</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Estado
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos</option>
              <option value="new">Nuevo</option>
              <option value="contacted">Contactado</option>
              <option value="interviewed">Entrevistado</option>
              <option value="hired">Contratado</option>
              <option value="rejected">Rechazado</option>
            </select>
          </div>
        </div>

        {/* Candidates List */}
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
            <p className="mt-4 text-gray-600 dark:text-slate-400">Cargando candidatos...</p>
          </div>
        ) : candidates.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-slate-400">
            <div className="text-6xl mb-4">👤</div>
            <p className="text-lg">No se encontraron candidatos</p>
          </div>
        ) : (
          <div className="space-y-4">
            {candidates.map((candidate) => {
              const lastConv = getLastConversation(candidate)
              return (
                <div
                  key={candidate._id}
                  className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 border border-gray-200 dark:border-slate-600 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-12 h-12 rounded-full bg-blue-500 dark:bg-blue-600 flex items-center justify-center">
                        <span className="text-white text-lg font-bold">
                          {candidate.instagramHandle.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold text-gray-800 dark:text-slate-100">
                            @{candidate.instagramHandle}
                          </h3>
                          {candidate.name && (
                            <span className="text-gray-600 dark:text-slate-400">({candidate.name})</span>
                          )}
                          <span className={`text-xs px-2 py-1 rounded ${getStatusColor(candidate.status)}`}>
                            {candidate.status}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600 dark:text-slate-400">
                          <span>Puntuación: <strong>{candidate.engagementScore}</strong></span>
                          {candidate.interestAreas && candidate.interestAreas.length > 0 && (
                            <span>
                              Intereses: {candidate.interestAreas.join(', ')}
                            </span>
                          )}
                          {lastConv && (
                            <span className="text-xs text-gray-500 dark:text-slate-500">
                              Last: {lastConv.type} • {new Date(lastConv.timestamp).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedCandidate(candidate)
                          setDmMessage('')
                        }}
                        className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-sm"
                      >
                        Ver Perfil
                      </button>
                      <select
                        value={candidate.status}
                        onChange={(e) => handleStatusChange(candidate._id, e.target.value)}
                        className="bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-slate-100"
                      >
                        <option value="new">Nuevo</option>
                        <option value="contacted">Contactado</option>
                        <option value="interviewed">Entrevistado</option>
                        <option value="hired">Contratado</option>
                        <option value="rejected">Rechazado</option>
                      </select>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Profile View Modal */}
      {selectedCandidate && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100">
              Profile: @{selectedCandidate.instagramHandle}
            </h2>
            <button
              onClick={() => {
                setSelectedCandidate(null)
                setDmMessage('')
              }}
              className="text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-slate-100">📋 Información</h3>
              <div className="space-y-2 text-sm">
                <p className="text-gray-700 dark:text-slate-300"><strong>Nombre:</strong> {selectedCandidate.name || 'N/A'}</p>
                <p className="text-gray-700 dark:text-slate-300"><strong>Correo:</strong> {selectedCandidate.email || 'N/A'}</p>
                <p className="text-gray-700 dark:text-slate-300"><strong>Teléfono:</strong> {selectedCandidate.phone || 'N/A'}</p>
                <p className="text-gray-700 dark:text-slate-300"><strong>Puntuación de Participación:</strong> {selectedCandidate.engagementScore}/100</p>
                <p className="text-gray-700 dark:text-slate-300"><strong>Estado:</strong> {selectedCandidate.status}</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-slate-100">💼 Intereses Laborales</h3>
              {selectedCandidate.jobOfferInterest && selectedCandidate.jobOfferInterest.length > 0 ? (
                <div className="space-y-2">
                  {selectedCandidate.jobOfferInterest.map((interest, index) => (
                    <div key={index} className="bg-gray-50 dark:bg-slate-700/50 p-2 rounded">
                      <p className="text-sm text-gray-700 dark:text-slate-300">
                        Nivel de Interés: <strong>{interest.interestLevel}</strong>
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-slate-400">Aún no hay intereses laborales</p>
              )}
            </div>
          </div>

          {/* Conversation History */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-slate-100">💬 Historial de Conversaciones</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto bg-gray-50 dark:bg-slate-700/30 p-4 rounded-lg">
              {selectedCandidate.conversations && selectedCandidate.conversations.length > 0 ? (
                selectedCandidate.conversations.map((conv, index) => (
                  <div key={index} className={`p-3 rounded-lg border-l-4 ${
                    conv.type === 'dm' 
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-600' 
                      : 'bg-gray-50 dark:bg-slate-700/50 border-gray-300 dark:border-slate-600'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-gray-800 dark:text-slate-200 capitalize">
                        {conv.type === 'dm' ? '💬 Mensaje Directo' : '💬 Respuesta a Comentario'}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        conv.sentiment === 'positive'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                          : conv.sentiment === 'negative'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                      }`}>
                        {conv.sentiment}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-slate-300">{conv.message}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                      {new Date(conv.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-slate-400 text-center py-4">Aún no hay conversaciones</p>
              )}
            </div>
          </div>

          {/* DM Follow-up Section */}
          <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
            <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-slate-100">💬 Continuar Conversación por DM</h3>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 mb-4">
              <p className="text-sm text-emerald-800 dark:text-emerald-300">
                <strong>💡 Consejo:</strong> Usa esto para hacer seguimiento con el usuario. Tu mensaje se enviará como un mensaje directo en Instagram.
              </p>
            </div>
            <textarea
              value={dmMessage}
              onChange={(e) => setDmMessage(e.target.value)}
              placeholder="Escribe tu mensaje para continuar la conversación por DM..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg mb-3 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            <div className="flex space-x-2">
              <button
                onClick={() => handleContinueDM(selectedCandidate._id, dmMessage)}
                disabled={!dmMessage.trim() || sendingDM}
                className="bg-emerald-600 dark:bg-emerald-500 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center space-x-2"
              >
                {sendingDM ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <span>💬</span>
                    <span>Enviar DM</span>
                  </>
                )}
              </button>
              <button
                onClick={() => handleInvite(selectedCandidate._id)}
                disabled={!dmMessage.trim() || sendingDM}
                className="bg-purple-600 dark:bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                📩 Enviar Invitación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Candidates
