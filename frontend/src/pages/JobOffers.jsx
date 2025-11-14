import { useState, useEffect } from 'react'
import axios from 'axios'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { JobOffersIcon } from '../components/Icons'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function JobOffers() {
  const [jobOffers, setJobOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingOffer, setEditingOffer] = useState(null)
  const [selectedOffer, setSelectedOffer] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    hashtags: '',
    autoPublish: false
  })
  const [analytics, setAnalytics] = useState(null)

  useEffect(() => {
    fetchJobOffers()
  }, [])

  const fetchJobOffers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/job-offers`)
      setJobOffers(response.data.data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching job offers:', error)
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const hashtagsArray = formData.hashtags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag)

      const payload = {
        ...formData,
        hashtags: hashtagsArray
      }

      if (editingOffer) {
        await axios.put(`${API_BASE_URL}/api/job-offers/${editingOffer._id}`, payload)
      } else {
        await axios.post(`${API_BASE_URL}/api/job-offers`, payload)
      }

      setShowForm(false)
      setEditingOffer(null)
      setFormData({ title: '', description: '', hashtags: '', autoPublish: false })
      fetchJobOffers()
    } catch (error) {
      console.error('Error saving job offer:', error)
      alert('Error al guardar la oferta')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta oferta?')) return
    
    try {
      await axios.delete(`${API_BASE_URL}/api/job-offers/${id}`)
      fetchJobOffers()
    } catch (error) {
      console.error('Error deleting job offer:', error)
      alert('Error al eliminar la oferta')
    }
  }

  const handlePublish = async (id, type = 'post') => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/job-offers/${id}/publish-instagram`, {
        type: type // 'post' or 'story'
      })
      
      if (response.data.success) {
        alert(`✅ Oferta publicada como ${type === 'post' ? 'Post' : 'Story'} en Instagram!`)
        fetchJobOffers()
        
        // Identificar candidatos después de unos segundos
        setTimeout(async () => {
          try {
            await axios.post(`${API_BASE_URL}/api/job-offers/${id}/identify-candidates`)
          } catch (error) {
            console.error('Error identifying candidates:', error)
          }
        }, 10000)
      }
    } catch (error) {
      console.error('Error publishing job offer:', error)
      alert('Error al publicar la oferta')
    }
  }

  const fetchAnalytics = async (id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/job-offers/${id}/analytics`)
      setAnalytics(response.data.data)
      setSelectedOffer(id)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    }
  }

  const chartData = analytics ? [
    { name: 'Reacciones', value: analytics.interactions.reactions },
    { name: 'Comentarios', value: analytics.interactions.comments },
    { name: 'Candidatos', value: analytics.candidates.total }
  ] : []

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center">
            <JobOffersIcon className="w-8 h-8 mr-3 text-blue-600 dark:text-blue-400" />
            Gestión de Ofertas Laborales
          </h1>
          <button
            onClick={() => {
              setShowForm(true)
              setEditingOffer(null)
              setFormData({ title: '', description: '', hashtags: '', autoPublish: false })
            }}
            className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors font-medium"
          >
            + Crear Oferta Laboral
          </button>
        </div>

        {/* Create/Edit Form */}
        {showForm && (
          <div className="mb-6 p-6 bg-gray-50 rounded-lg border-2 border-blue-200">
            <h2 className="text-xl font-semibold mb-4">
              {editingOffer ? 'Editar Oferta Laboral' : 'Crear Nueva Oferta Laboral'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hashtags (separados por comas)
                </label>
                <input
                  type="text"
                  value={formData.hashtags}
                  onChange={(e) => setFormData({ ...formData, hashtags: e.target.value })}
                  placeholder="trabajo, empleo, carrera"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoPublish"
                  checked={formData.autoPublish}
                  onChange={(e) => setFormData({ ...formData, autoPublish: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="autoPublish" className="text-sm text-gray-700">
                  Habilitar Publicación Automatizada
                </label>
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors font-medium"
                >
                  {editingOffer ? 'Actualizar' : 'Crear'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingOffer(null)
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Job Offers List */}
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Cargando ofertas laborales...</p>
          </div>
        ) : jobOffers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-lg">Aún no hay ofertas laborales</p>
            <p className="text-sm">Crea tu primera oferta laboral para comenzar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobOffers.map((offer) => (
              <div key={offer._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-800">{offer.title}</h3>
                  {offer.published && (
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                      Publicada
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                  {offer.description}
                </p>
                {offer.hashtags.length > 0 && (
                  <div className="mb-3">
                    {offer.hashtags.map((tag, index) => (
                      <span key={index} className="text-xs text-blue-600 mr-2">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <span>Reacciones: {offer.analytics?.reactions || 0}</span>
                  <span>Candidatos: {offer.analytics?.interestedCandidates || 0}</span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => fetchAnalytics(offer._id)}
                    className="flex-1 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    📈 Analíticas
                  </button>
                  {!offer.published ? (
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handlePublish(offer._id, 'post')}
                        className="flex-1 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                        title="Publicar como Post"
                      >
                        📱 Post
                      </button>
                      <button
                        onClick={() => handlePublish(offer._id, 'story')}
                        className="flex-1 bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 transition-colors"
                        title="Publicar como Story"
                      >
                        📸 Story
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={async () => {
                        try {
                          await axios.post(`${API_BASE_URL}/api/job-offers/${offer._id}/identify-candidates`)
                          alert('✅ Candidatos identificados exitosamente!')
                          fetchJobOffers()
                        } catch (error) {
                          console.error('Error identifying candidates:', error)
                          alert('Error al identificar candidatos')
                        }
                      }}
                      className="flex-1 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                      title="Identificar candidatos interesados"
                    >
                      🔍 Buscar Candidatos
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setEditingOffer(offer)
                      setFormData({
                        title: offer.title,
                        description: offer.description,
                        hashtags: offer.hashtags.join(', '),
                        autoPublish: offer.autoPublish
                      })
                      setShowForm(true)
                    }}
                    className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(offer._id)}
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Analytics Modal */}
      {analytics && selectedOffer && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Panel de Analíticas</h2>
            <button
              onClick={() => {
                setAnalytics(null)
                setSelectedOffer(null)
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Reacciones</p>
              <p className="text-2xl font-bold text-blue-600">
                {analytics.interactions.reactions}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Comentarios</p>
              <p className="text-2xl font-bold text-green-600">
                {analytics.interactions.comments}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Candidatos</p>
              <p className="text-2xl font-bold text-purple-600">
                {analytics.candidates.total}
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total de Interacciones</p>
              <p className="text-2xl font-bold text-yellow-600">
                {analytics.interactions.total}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Gráfico de Participación</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {analytics.candidates.total > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Candidatos Interesados</h3>
              <div className="space-y-2">
                {analytics.candidates.list.slice(0, 10).map((candidate) => (
                  <div key={candidate._id} className="bg-gray-50 p-3 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">@{candidate.instagramHandle}</p>
                      {candidate.name && (
                        <p className="text-sm text-gray-600">{candidate.name}</p>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      Puntuación: {candidate.engagementScore}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default JobOffers

