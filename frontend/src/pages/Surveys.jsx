import { useState, useEffect } from 'react'
import axios from 'axios'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { SurveysIcon } from '../components/Icons'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function Surveys() {
  const [surveys, setSurveys] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedSurvey, setSelectedSurvey] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    question: '',
    type: 'poll',
    options: ['', ''],
    audienceTarget: 'all'
  })

  useEffect(() => {
    fetchSurveys()
  }, [])

  const fetchSurveys = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/surveys`)
      setSurveys(response.data.data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching surveys:', error)
      setLoading(false)
    }
  }

  const handleAddOption = () => {
    setFormData({
      ...formData,
      options: [...formData.options, '']
    })
  }

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options]
    newOptions[index] = value
    setFormData({ ...formData, options: newOptions })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...formData,
        options: formData.options
          .map(opt => ({ text: opt.trim(), votes: 0, voters: [] }))
          .filter(opt => opt.text)
      }

      await axios.post(`${API_BASE_URL}/api/surveys`, payload)
      setShowForm(false)
      setFormData({
        title: '',
        question: '',
        type: 'poll',
        options: ['', ''],
        audienceTarget: 'all'
      })
      fetchSurveys()
    } catch (error) {
      console.error('Error creating survey:', error)
      alert('Error al crear la encuesta')
    }
  }

  const handleExport = async (surveyId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/surveys/${surveyId}/export`,
        { responseType: 'blob' }
      )
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `survey-${surveyId}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Error exporting survey:', error)
      alert('Error al exportar los datos')
    }
  }

  const handlePublish = async (id, type = 'post') => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/surveys/${id}/publish-instagram`, {
        type: type // 'post' or 'story'
      })
      
      if (response.data.success) {
        alert(`✅ Encuesta publicada como ${type === 'post' ? 'Post' : 'Story'} en Instagram!`)
        fetchSurveys()
      }
    } catch (error) {
      console.error('Error publishing survey:', error)
      alert('Error al publicar la encuesta')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta encuesta?')) return
    
    try {
      await axios.delete(`${API_BASE_URL}/api/surveys/${id}`)
      fetchSurveys()
    } catch (error) {
      console.error('Error deleting survey:', error)
      alert('Error al eliminar la encuesta')
    }
  }

  const getChartData = (survey) => {
    const totalVotes = survey.options.reduce((sum, opt) => sum + opt.votes, 0)
    return survey.options.map(opt => ({
      name: opt.text,
      value: opt.votes,
      percentage: totalVotes > 0 ? ((opt.votes / totalVotes) * 100).toFixed(1) : 0
    }))
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center">
            <SurveysIcon className="w-8 h-8 mr-3 text-blue-600 dark:text-blue-400" />
            Encuestas y Votaciones
          </h1>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Crear Encuesta
          </button>
        </div>

        {/* Create Form */}
        {showForm && (
          <div className="mb-6 p-6 bg-gray-50 rounded-lg border-2 border-blue-200">
            <h2 className="text-xl font-semibold mb-4">Crear Nueva Encuesta/Votación</h2>
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
                  Pregunta *
                </label>
                <input
                  type="text"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="poll">Votación</option>
                  <option value="survey">Encuesta</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opciones *
                </label>
                {formData.options.map((option, index) => (
                  <input
                    key={index}
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Opción ${index + 1}`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ))}
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  + Agregar Opción
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Audiencia Objetivo
                </label>
                <select
                  value={formData.audienceTarget}
                  onChange={(e) => setFormData({ ...formData, audienceTarget: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todos</option>
                  <option value="candidates">Candidatos</option>
                  <option value="followers">Seguidores</option>
                  <option value="custom">Personalizado</option>
                </select>
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Crear
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Surveys List */}
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Cargando encuestas...</p>
          </div>
        ) : surveys.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-lg">Aún no hay encuestas</p>
          </div>
        ) : (
          <div className="space-y-6">
            {surveys.map((survey) => (
              <div key={survey._id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">{survey.title}</h3>
                    <p className="text-gray-600 mt-1">{survey.question}</p>
                  </div>
                  <div className="flex space-x-2">
                    {!survey.published ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handlePublish(survey._id, 'post')}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                          title="Publicar como Post"
                        >
                          📱 Post
                        </button>
                        <button
                          onClick={() => handlePublish(survey._id, 'story')}
                          className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 transition-colors"
                          title="Publicar como Story"
                        >
                          📸 Story
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-green-600 font-semibold">Publicada</span>
                    )}
                    <button
                      onClick={() => handleExport(survey._id)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      📥 Export CSV
                    </button>
                    <button
                      onClick={() => handleDelete(survey._id)}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Pie Chart */}
                  <div>
                    <h4 className="text-lg font-semibold mb-3">Visualización de Resultados</h4>
                    {survey.totalResponses > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={getChartData(survey)}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percentage }) => `${name}: ${percentage}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {getChartData(survey).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>Aún no hay respuestas</p>
                      </div>
                    )}
                  </div>

                  {/* Bar Chart */}
                  <div>
                    <h4 className="text-lg font-semibold mb-3">Desglose de Votos</h4>
                    {survey.totalResponses > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={getChartData(survey)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>Aún no hay respuestas</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      Total de Respuestas: <strong>{survey.totalResponses}</strong>
                    </span>
                    {survey.nlpInsights?.topics && survey.nlpInsights.topics.length > 0 && (
                      <div>
                        <span className="text-gray-600 mr-2">Temas:</span>
                        {survey.nlpInsights.topics.map((topic, index) => (
                          <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded mr-1">
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Surveys

