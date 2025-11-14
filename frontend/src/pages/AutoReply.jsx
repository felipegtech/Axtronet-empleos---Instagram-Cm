import { useState, useEffect } from 'react'
import axios from 'axios'
import { AutoReplyIcon } from '../components/Icons'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function AutoReply() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [preview, setPreview] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    template: '',
    category: 'general',
    isActive: true,
    isDefault: false,
    smartRules: {
      keywords: [],
      sentiment: 'any',
      triggerOn: 'always'
    }
  })
  const [newKeyword, setNewKeyword] = useState('')
  const [previewVars, setPreviewVars] = useState({
    username: 'username',
    post_title: 'Título de Publicación',
    sentiment: 'neutral',
    company_name: 'Company',
    smart_reply: '¡Gracias por tu interés! 🚀',
    original_comment: 'Hola, estoy interesado en la vacante',
    topics: 'salario, horario',
    job_keywords: 'vacante, remoto',
    priority: 'medium'
  })

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/auto-reply/templates`)
      setTemplates(response.data.data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching templates:', error)
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingTemplate) {
        await axios.put(
          `${API_BASE_URL}/api/auto-reply/templates/${editingTemplate._id}`,
          formData
        )
      } else {
        await axios.post(`${API_BASE_URL}/api/auto-reply/templates`, formData)
      }

      setShowForm(false)
      setEditingTemplate(null)
      setFormData({
        name: '',
        template: '',
        category: 'general',
        isActive: true,
        isDefault: false,
        smartRules: {
          keywords: [],
          sentiment: 'any',
          triggerOn: 'always'
        }
      })
      fetchTemplates()
    } catch (error) {
      console.error('Error saving template:', error)
      alert('Error al guardar la plantilla')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta plantilla?')) return

    try {
      await axios.delete(`${API_BASE_URL}/api/auto-reply/templates/${id}`)
      fetchTemplates()
    } catch (error) {
      console.error('Error deleting template:', error)
      alert('Error al eliminar la plantilla')
    }
  }

  const handleAddKeyword = () => {
    if (newKeyword.trim()) {
      setFormData({
        ...formData,
        smartRules: {
          ...formData.smartRules,
          keywords: [...formData.smartRules.keywords, newKeyword.trim().toLowerCase()]
        }
      })
      setNewKeyword('')
    }
  }

  const handleRemoveKeyword = (index) => {
    const newKeywords = formData.smartRules.keywords.filter((_, i) => i !== index)
    setFormData({
      ...formData,
      smartRules: {
        ...formData.smartRules,
        keywords: newKeywords
      }
    })
  }

  const handleSetDefault = async (template) => {
    try {
      await axios.put(`${API_BASE_URL}/api/auto-reply/templates/${template._id}`, {
        isDefault: true
      })

      fetchTemplates()
      alert(`La plantilla "${template.name}" es ahora la predeterminada`)
    } catch (error) {
      console.error('Error setting default template:', error)
      alert('No se pudo establecer la plantilla predeterminada')
    }
  }

  const generatePreview = async () => {
    if (!selectedTemplate) return

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/auto-reply/templates/${selectedTemplate._id}/preview`,
        previewVars
      )
      setPreview(response.data.data.preview)
    } catch (error) {
      console.error('Error generating preview:', error)
    }
  }

  useEffect(() => {
    if (selectedTemplate) {
      generatePreview()
    }
  }, [selectedTemplate, previewVars])

  const defaultTemplate = `Hola @{username}! 👋 Nos encanta que estés interesado en el proceso 💼. 

Nuestro equipo revisará tu perfil y te contactaremos pronto. 🚀`

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center">
            <AutoReplyIcon className="w-8 h-8 mr-3 text-blue-600 dark:text-blue-400" />
            Centro de Mensajes Auto-Respuesta
          </h1>
          <button
            onClick={() => {
              setShowForm(true)
              setEditingTemplate(null)
              setFormData({
                name: '',
                template: defaultTemplate,
                category: 'general',
                isActive: true,
                isDefault: false,
                smartRules: {
                  keywords: [],
                  sentiment: 'any',
                  triggerOn: 'always'
                }
              })
            }}
            className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            + Crear Plantilla
          </button>
        </div>

        {/* Create/Edit Form */}
        {showForm && (
          <div className="mb-6 p-6 bg-gray-50 dark:bg-slate-700/50 rounded-lg border-2 border-blue-200 dark:border-blue-800">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-slate-100">
              {editingTemplate ? 'Editar Plantilla' : 'Crear Nueva Plantilla'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Nombre de Plantilla *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Plantilla de Mensaje *
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Variables disponibles: {'{username}'}, {'{post_title}'}, {'{sentiment}'}, {'{company_name}'}, {'{smart_reply}'}, {'{original_comment}'}, {'{topics}'}, {'{job_keywords}'}, {'{priority}'}
                </p>
                <textarea
                  value={formData.template}
                  onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                  required
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Categoría
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="general">General</option>
                  <option value="job_interest">Interés Laboral</option>
                  <option value="thanks">Agradecimiento</option>
                  <option value="inquiry">Consulta</option>
                  <option value="custom">Personalizado</option>
                </select>
              </div>

              {/* Smart Rules */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-3">⚙️ Smart Rules</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Palabras Clave (una por línea)
                  </label>
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
                      placeholder="e.g., vacante, sueldo"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={handleAddKeyword}
                      className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Agregar
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.smartRules.keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center"
                      >
                        {keyword}
                        <button
                          type="button"
                          onClick={() => handleRemoveKeyword(index)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      Filtro de Sentimiento
                    </label>
                    <select
                      value={formData.smartRules.sentiment}
                      onChange={(e) => setFormData({
                        ...formData,
                        smartRules: { ...formData.smartRules, sentiment: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="any">Any</option>
                      <option value="positive">Positive</option>
                      <option value="neutral">Neutral</option>
                      <option value="negative">Negative</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      Activar Cuando
                    </label>
                    <select
                      value={formData.smartRules.triggerOn}
                      onChange={(e) => setFormData({
                        ...formData,
                        smartRules: { ...formData.smartRules, triggerOn: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="always">Siempre</option>
                      <option value="keyword">Palabra Clave</option>
                      <option value="sentiment">Sentimiento</option>
                      <option value="both">Ambos</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Activo</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Plantilla Predeterminada</span>
                </label>
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                >
                  {editingTemplate ? 'Actualizar' : 'Crear'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingTemplate(null)
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Templates List */}
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Cargando plantillas...</p>
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">📝</div>
            <p className="text-lg">Aún no hay plantillas</p>
          </div>
        ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {templates.map((template) => (
              <div
                key={template._id}
                className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 border border-gray-200 dark:border-slate-600"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-slate-100">{template.name}</h3>
                <span className="text-xs text-gray-500 dark:text-slate-400">{template.category}</span>
                  </div>
                  <div className="flex space-x-2">
                    {template.isDefault && (
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                        Default
                      </span>
                    )}
                    {template.isActive ? (
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                        Activo
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded">
                        Inactivo
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-slate-300 mb-3 line-clamp-3">{template.template}</p>
                {template.smartRules.keywords.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">Palabras Clave:</p>
                    <div className="flex flex-wrap gap-1">
                      {template.smartRules.keywords.slice(0, 3).map((keyword, index) => (
                        <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setSelectedTemplate(template)
                    }}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    Vista Previa
                  </button>
                  {!template.isDefault && (
                    <button
                      onClick={() => handleSetDefault(template)}
                      className="bg-emerald-600 text-white px-3 py-1 rounded text-sm hover:bg-emerald-700 transition-colors"
                    >
                      Predeterminada
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setEditingTemplate(template)
                      setFormData({
                        name: template.name,
                        template: template.template,
                        category: template.category,
                        isActive: template.isActive,
                        isDefault: template.isDefault,
                        smartRules: {
                          keywords: [...(template.smartRules?.keywords || [])],
                          sentiment: template.smartRules?.sentiment || 'any',
                          triggerOn: template.smartRules?.triggerOn || 'always'
                        }
                      })
                      setShowForm(true)
                    }}
                    className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(template._id)}
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

      {/* Preview Panel */}
      {selectedTemplate && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">🔄 Panel de Vista Previa</h2>
            <button
              onClick={() => setSelectedTemplate(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Variables</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de Usuario
                  </label>
                  <input
                    type="text"
                    value={previewVars.username}
                    onChange={(e) => setPreviewVars({ ...previewVars, username: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título de Publicación
                  </label>
                  <input
                    type="text"
                    value={previewVars.post_title}
                    onChange={(e) => setPreviewVars({ ...previewVars, post_title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sentimiento
                  </label>
                  <select
                    value={previewVars.sentiment}
                    onChange={(e) => setPreviewVars({ ...previewVars, sentiment: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="positive">Positive</option>
                    <option value="neutral">Neutral</option>
                    <option value="negative">Negative</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de Empresa
                  </label>
                  <input
                    type="text"
                    value={previewVars.company_name}
                    onChange={(e) => setPreviewVars({ ...previewVars, company_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Smart Reply (auto sugerido)
                  </label>
                  <textarea
                    value={previewVars.smart_reply}
                    onChange={(e) => setPreviewVars({ ...previewVars, smart_reply: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Comentario original
                  </label>
                  <textarea
                    value={previewVars.original_comment}
                    onChange={(e) => setPreviewVars({ ...previewVars, original_comment: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Temas detectados
                    </label>
                    <input
                      type="text"
                      value={previewVars.topics}
                      onChange={(e) => setPreviewVars({ ...previewVars, topics: e.target.value })}
                      placeholder="salario, horario"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Palabras clave trabajo
                    </label>
                    <input
                      type="text"
                      value={previewVars.job_keywords}
                      onChange={(e) => setPreviewVars({ ...previewVars, job_keywords: e.target.value })}
                      placeholder="vacante, remoto"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prioridad detectada
                  </label>
                  <select
                    value={previewVars.priority}
                    onChange={(e) => setPreviewVars({ ...previewVars, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Vista Previa</h3>
              <div className="bg-gray-50 p-4 rounded-lg border-2 border-blue-200 min-h-[200px]">
                <p className="whitespace-pre-wrap text-gray-800">{preview || selectedTemplate.template}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AutoReply

