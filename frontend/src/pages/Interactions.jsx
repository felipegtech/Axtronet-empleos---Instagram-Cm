import { useState, useEffect } from 'react'
import axios from 'axios'
import { InteractionsIcon } from '../components/Icons'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function Interactions() {
  const [interactions, setInteractions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    type: '',
    source: '',
    sentiment: '',
    reactionType: ''
  })
  const [selectedInteraction, setSelectedInteraction] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [predefinedReplies] = useState([
    'Hola! Gracias por tu interés. Te contactaremos pronto.',
    'Gracias por tu comentario. Revisa nuestra biografía para más información.',
    '¡Excelente! Nuestro equipo revisará tu perfil.',
    'Nos encanta tu interés. Déjanos un DM para más detalles.'
  ])
  const [aiSuggestion, setAiSuggestion] = useState('')

  useEffect(() => {
    fetchInteractions()
  }, [filters])

  const fetchInteractions = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.type) params.append('type', filters.type)
      if (filters.source) params.append('source', filters.source)
      if (filters.sentiment) params.append('sentiment', filters.sentiment)
      
      const response = await axios.get(
        `${API_BASE_URL}/api/interactions?${params.toString()}`
      )
      let filtered = response.data.data
      
      if (filters.reactionType) {
        filtered = filtered.filter(i => i.reactionType === filters.reactionType)
      }
      
      setInteractions(filtered)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching interactions:', error)
      setLoading(false)
    }
  }

  const generateAISuggestion = (interaction) => {
    // Simple AI suggestion based on sentiment
    if (interaction.sentiment === 'positive') {
      return '¡Gracias por tu interés! Nos encanta tu entusiasmo. 💼'
    } else if (interaction.sentiment === 'negative') {
      return 'Lamentamos tu experiencia. Por favor, contáctanos por DM para resolver esto.'
    } else {
      return 'Hola @' + interaction.user + '! 👋 Gracias por tu comentario. Te contactaremos pronto.'
    }
  }

  const handleReply = async (moveToDM = false) => {
    if (!selectedInteraction || !replyText.trim()) return

    try {
      await axios.post(
        `${API_BASE_URL}/api/interactions/${selectedInteraction._id}/reply`,
        { message: replyText, moveToDM }
      )
      
      // Si es DM, usar el endpoint de continuar conversación
      if (moveToDM) {
        // Buscar el candidato
        try {
          const candidatesResponse = await axios.get(`${API_BASE_URL}/api/candidates`)
          const candidate = candidatesResponse.data.data.find(
            c => c.instagramHandle === selectedInteraction.user.toLowerCase()
          )
          
          if (candidate) {
            await axios.post(`${API_BASE_URL}/api/candidates/${candidate._id}/continue-dm`, {
              message: replyText
            })
          }
        } catch (error) {
          console.error('Error sending DM:', error)
        }
      }
      
      // Update local state
      setInteractions(interactions.map(i => 
        i._id === selectedInteraction._id 
          ? { ...i, replied: true, replyMessage: replyText, movedToDM: moveToDM }
          : i
      ))
      
      setSelectedInteraction(null)
      setReplyText('')
      setAiSuggestion('')
      alert('✅ Respuesta enviada exitosamente!')
    } catch (error) {
      console.error('Error sending reply:', error)
      alert('Error al enviar respuesta')
    }
  }

  const handleAnalyzeInteraction = async (interactionId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/interactions/${interactionId}/analyze`)
      alert('✅ Interacción analizada con NLP!')
      fetchInteractions()
    } catch (error) {
      console.error('Error analyzing interaction:', error)
      alert('Error al analizar interacción')
    }
  }

  const handleProcessAutoReply = async (interactionId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/interactions/${interactionId}/process-auto-reply`)
      if (response.data.result.shouldReply) {
        alert('✅ Auto-reply enviado exitosamente!')
      } else {
        alert('ℹ️ Auto-reply no aplicable para esta interacción')
      }
      fetchInteractions()
    } catch (error) {
      console.error('Error processing auto-reply:', error)
      alert('Error al procesar auto-reply')
    }
  }

  const handlePredefinedReply = (reply) => {
    setReplyText(reply)
    if (selectedInteraction) {
      setAiSuggestion(generateAISuggestion(selectedInteraction))
    }
  }

  const getReactionEmoji = (type) => {
    const emojis = {
      'like': '❤️',
      'love': '😍',
      'haha': '😂',
      'wow': '😮',
      'sad': '😢',
      'angry': '😠'
    }
    return emojis[type] || '❤️'
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-slate-200 dark:border-slate-700">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center">
            <InteractionsIcon className="w-8 h-8 mr-3 text-blue-600 dark:text-blue-400" />
            Escucha de Instagram / Interacciones
          </h1>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Publicación/Historia
            </label>
            <select
              value={filters.source}
              onChange={(e) => setFilters({ ...filters, source: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos</option>
              <option value="post">Publicación</option>
              <option value="story">Historia</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Tipo
            </label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos</option>
              <option value="comment">Comentario</option>
              <option value="reaction">Reacción</option>
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
              <option value="wow">😮 Wow</option>
              <option value="sad">😢 Triste</option>
              <option value="angry">😠 Enojado</option>
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Live Feed */}
          <div className="lg:col-span-2">
            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Feed en Vivo</h2>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
                  <p className="mt-4 text-gray-600 dark:text-slate-400">Cargando interacciones...</p>
                </div>
              ) : interactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-slate-400">
                  <div className="text-4xl mb-2">📭</div>
                  <p>No se encontraron interacciones</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {interactions.map((interaction) => (
                    <div
                      key={interaction._id}
                      className={`bg-white dark:bg-slate-800 p-4 rounded-lg border-l-4 cursor-pointer transition-all ${
                        interaction.sentiment === 'negative'
                          ? 'border-red-500 dark:border-red-600 bg-red-50 dark:bg-red-900/20'
                          : interaction.sentiment === 'positive'
                          ? 'border-green-500 dark:border-green-600 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-300 dark:border-slate-600'
                      } ${
                        selectedInteraction?._id === interaction._id
                          ? 'ring-2 ring-blue-500 dark:ring-blue-400'
                          : ''
                      }`}
                      onClick={() => {
                        setSelectedInteraction(interaction)
                        setAiSuggestion(generateAISuggestion(interaction))
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-semibold text-gray-800 dark:text-slate-200">
                              {interaction.user}
                            </span>
                            {interaction.type === 'reaction' && (
                              <span className="text-xl">
                                {getReactionEmoji(interaction.reactionType)}
                              </span>
                            )}
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              interaction.sentiment === 'positive'
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                : interaction.sentiment === 'negative'
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                            }`}>
                              {interaction.sentiment}
                            </span>
                            {interaction.replied && (
                              <span className="text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                                ✓ Replied
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 dark:text-slate-300">{interaction.message}</p>
                          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                            {new Date(interaction.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Reply Panel */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Panel de Respuesta Rápida</h2>
              
              {selectedInteraction ? (
                <div className="space-y-4">
                  <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-600">
                    <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">Respondiendo a:</p>
                    <p className="font-semibold text-gray-800 dark:text-slate-200">{selectedInteraction.user}</p>
                    <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">{selectedInteraction.message}</p>
                  </div>

                  {/* AI Suggestion */}
                  {aiSuggestion && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1">🤖 Sugerencia de IA:</p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">{aiSuggestion}</p>
                      <button
                        onClick={() => setReplyText(aiSuggestion)}
                        className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
                      >
                        Usar esta sugerencia
                      </button>
                    </div>
                  )}

                  {/* Predefined Replies */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Respuestas Predefinidas:</p>
                    <div className="space-y-2">
                      {predefinedReplies.map((reply, index) => (
                        <button
                          key={index}
                          onClick={() => handlePredefinedReply(reply)}
                          className="w-full text-left text-xs p-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-gray-700 dark:text-slate-300"
                        >
                          {reply.substring(0, 50)}...
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Text Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      Respuesta Personalizada:
                    </label>
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Escribe tu respuesta aquí..."
                    />
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <button
                      onClick={() => handleReply(false)}
                      disabled={!replyText.trim()}
                      className="w-full bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      💬 Responder como Comentario
                    </button>
                    <button
                      onClick={() => handleReply(true)}
                      disabled={!replyText.trim()}
                      className="w-full bg-purple-600 dark:bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      📩 Mover a DM
                    </button>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleAnalyzeInteraction(selectedInteraction._id)}
                        className="flex-1 bg-emerald-600 dark:bg-emerald-500 text-white px-3 py-2 rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors text-sm"
                      >
                        🧠 Analizar NLP
                      </button>
                      <button
                        onClick={() => handleProcessAutoReply(selectedInteraction._id)}
                        className="flex-1 bg-orange-600 dark:bg-orange-500 text-white px-3 py-2 rounded-lg hover:bg-orange-700 dark:hover:bg-orange-600 transition-colors text-sm"
                      >
                        🤖 Auto-Reply
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-slate-400">
                  <div className="text-4xl mb-2">👆</div>
                  <p>Selecciona una interacción para responder</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Interactions

