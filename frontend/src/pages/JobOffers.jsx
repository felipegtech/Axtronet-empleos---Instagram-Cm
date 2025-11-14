import { useState, useEffect } from 'react'
import axios from 'axios'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { 
  JobOffersIcon, 
  ChartBarIcon, 
  UsersIcon, 
  HeartIcon, 
  CommentIcon,
  InboxIcon,
  ArrowUpIcon,
  CheckCircleIcon,
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  ImageIcon,
  VideoIcon,
  FilmIcon,
  ShareIcon,
  HashtagIcon
} from '../components/Icons'

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
    autoPublish: false,
    mediaType: 'image',
    image: null,
    video: null,
    carouselImages: [],
    coverImage: null
  })
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(null)
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

  const handleFileUpload = async (file, type = 'image') => {
    try {
      const formDataUpload = new FormData()
      formDataUpload.append(type === 'video' ? 'video' : 'image', file)
      formDataUpload.append('type', 'jobOffers')
      formDataUpload.append('entityType', 'jobOffer')

      const response = await axios.post(`${API_BASE_URL}/api/upload/${type === 'video' ? 'video' : 'image'}`, formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.data.success) {
        return response.data.data
      } else {
        throw new Error(response.data.message || 'Error subiendo archivo')
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      throw error
    }
  }

  const handleMultipleFileUpload = async (files) => {
    try {
      const formDataUpload = new FormData()
      Array.from(files).forEach(file => {
        formDataUpload.append('images', file)
      })
      formDataUpload.append('type', 'jobOffers')
      formDataUpload.append('entityType', 'jobOffer')

      const response = await axios.post(`${API_BASE_URL}/api/upload/images`, formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.data.success) {
        return response.data.data
      } else {
        throw new Error(response.data.message || 'Error subiendo archivos')
      }
    } catch (error) {
      console.error('Error uploading files:', error)
      throw error
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validaciones básicas
    if (!formData.title || !formData.description) {
      alert('Por favor completa el título y la descripción')
      return
    }

    try {
      setUploading(true)
      const hashtagsArray = formData.hashtags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag)

      let payload = {
        title: formData.title,
        description: formData.description,
        hashtags: hashtagsArray,
        autoPublish: formData.autoPublish,
        mediaType: formData.mediaType
      }

      // Subir archivos según el tipo de media
      if (formData.mediaType === 'image') {
        if (!formData.image) {
          alert('Por favor selecciona una imagen')
          setUploading(false)
          return
        }
        console.log('📤 Subiendo imagen...')
        const uploaded = await handleFileUpload(formData.image, 'image')
        payload.imagePath = uploaded.path
        payload.imageUrl = `${API_BASE_URL}${uploaded.url}`
        console.log('✅ Imagen subida:', uploaded)
      } else if ((formData.mediaType === 'reel' || formData.mediaType === 'video')) {
        if (!formData.video) {
          alert('Por favor selecciona un video')
          setUploading(false)
          return
        }
        console.log('📤 Subiendo video...')
        const uploaded = await handleFileUpload(formData.video, 'video')
        payload.videoPath = uploaded.path
        payload.videoUrl = `${API_BASE_URL}${uploaded.url}`
        console.log('✅ Video subido:', uploaded)
        
        if (formData.coverImage) {
          console.log('📤 Subiendo imagen de portada...')
          const coverUploaded = await handleFileUpload(formData.coverImage, 'image')
          payload.coverImageUrl = `${API_BASE_URL}${coverUploaded.url}`
          console.log('✅ Portada subida:', coverUploaded)
        }
      } else if (formData.mediaType === 'carousel') {
        if (!formData.carouselImages || formData.carouselImages.length < 2) {
          alert('El carrusel debe tener al menos 2 imágenes')
          setUploading(false)
          return
        }
        console.log('📤 Subiendo carrusel...')
        const uploaded = await handleMultipleFileUpload(formData.carouselImages)
        payload.carouselImages = uploaded.map(file => ({
          path: file.path,
          url: `${API_BASE_URL}${file.url}`
        }))
        console.log('✅ Carrusel subido:', uploaded)
      }

      console.log('💾 Guardando oferta laboral...', payload)
      
      let response
      if (editingOffer) {
        response = await axios.put(`${API_BASE_URL}/api/job-offers/${editingOffer._id}`, payload)
      } else {
        response = await axios.post(`${API_BASE_URL}/api/job-offers`, payload)
      }

      if (response.data.success) {
        alert('✅ Oferta laboral guardada exitosamente!')
        setShowForm(false)
        setEditingOffer(null)
        setFormData({ 
          title: '', 
          description: '', 
          hashtags: '', 
          autoPublish: false,
          mediaType: 'image',
          image: null,
          video: null,
          carouselImages: [],
          coverImage: null
        })
        setPreview(null)
        fetchJobOffers()
      } else {
        throw new Error(response.data.message || 'Error guardando la oferta')
      }
    } catch (error) {
      console.error('Error saving job offer:', error)
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message
      alert('Error al guardar la oferta: ' + errorMessage)
    } finally {
      setUploading(false)
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
    if (!confirm(`¿Estás seguro de publicar esta oferta en Instagram como ${type === 'post' ? 'Post' : 'Story'}?`)) {
      return
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/job-offers/${id}/publish-instagram`, {
        type: type // 'post' or 'story'
      })
      
      if (response.data.success) {
        const mediaType = response.data.jobOffer?.mediaType || 'imagen'
        alert(`✅ Oferta publicada exitosamente en Instagram!\n\nTipo: ${mediaType}\nPost ID: ${response.data.instagramResult?.postId || 'N/A'}`)
        fetchJobOffers()
        
        // Identificar candidatos después de unos segundos
        setTimeout(async () => {
          try {
            await axios.post(`${API_BASE_URL}/api/job-offers/${id}/identify-candidates`)
            console.log('✅ Candidatos identificados')
          } catch (error) {
            console.error('Error identifying candidates:', error)
          }
        }, 10000)
      } else {
        throw new Error(response.data.message || 'Error al publicar')
      }
    } catch (error) {
      console.error('Error publishing job offer:', error)
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message
      alert(`❌ Error al publicar la oferta:\n\n${errorMessage}\n\nVerifica que:\n- El token de Instagram esté configurado\n- Los archivos estén subidos correctamente\n- Tengas los permisos necesarios`)
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
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <JobOffersIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Gestión de Ofertas Laborales
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Crea, gestiona y publica ofertas laborales en Instagram
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setShowForm(true)
              setEditingOffer(null)
              setFormData({ 
                title: '', 
                description: '', 
                hashtags: '', 
                autoPublish: false,
                mediaType: 'image',
                image: null,
                video: null,
                carouselImages: [],
                coverImage: null
              })
              setPreview(null)
            }}
            className="bg-blue-600 dark:bg-blue-700 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition-all duration-200 font-semibold flex items-center space-x-2 shadow-sm hover:shadow-md"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Nueva Oferta</span>
          </button>
        </div>

        {/* Create/Edit Form */}
        {showForm && (
          <div className="mb-6 p-8 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                {editingOffer ? 'Editar Oferta Laboral' : 'Nueva Oferta Laboral'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false)
                  setEditingOffer(null)
                  setPreview(null)
                }}
                className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder="Ej: Desarrollador Full Stack"
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                    Tipo de Media *
                  </label>
                  <select
                    value={formData.mediaType}
                    onChange={(e) => {
                      setFormData({ ...formData, mediaType: e.target.value, image: null, video: null, carouselImages: [] })
                      setPreview(null)
                    }}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 transition-all"
                  >
                    <option value="image">📷 Imagen</option>
                    <option value="carousel">🖼️ Carrusel (2-10 imágenes)</option>
                    <option value="reel">🎬 Reel/Video</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                  Descripción *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={5}
                  placeholder="Describe la oferta laboral, requisitos, beneficios..."
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 transition-all resize-none"
                />
              </div>
              {/* Media Upload Section */}
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center space-x-2 mb-4">
                  {formData.mediaType === 'image' && <ImageIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                  {formData.mediaType === 'carousel' && <FilmIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                  {(formData.mediaType === 'reel' || formData.mediaType === 'video') && <VideoIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    {formData.mediaType === 'image' ? 'Imagen' : formData.mediaType === 'carousel' ? 'Carrusel de Imágenes' : 'Video/Reel'} *
                  </label>
                </div>

                {formData.mediaType === 'image' && (
                  <div>
                    <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0]
                          if (file) {
                            setFormData({ ...formData, image: file })
                            setPreview(URL.createObjectURL(file))
                          }
                        }}
                        className="w-full text-sm text-slate-600 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900/20 file:text-blue-700 dark:file:text-blue-400 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/30 cursor-pointer"
                      />
                    </div>
                    {preview && (
                      <div className="mt-4">
                        <img src={preview} alt="Preview" className="max-w-md rounded-lg shadow-md border border-slate-200 dark:border-slate-700" />
                      </div>
                    )}
                  </div>
                )}

                {formData.mediaType === 'carousel' && (
                  <div>
                    <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files)
                          if (files.length >= 2 && files.length <= 10) {
                            setFormData({ ...formData, carouselImages: files })
                            setPreview(files.map(f => URL.createObjectURL(f)))
                          } else {
                            alert('El carrusel debe tener entre 2 y 10 imágenes')
                          }
                        }}
                        className="w-full text-sm text-slate-600 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900/20 file:text-blue-700 dark:file:text-blue-400 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/30 cursor-pointer"
                      />
                    </div>
                    {preview && Array.isArray(preview) && (
                      <div className="mt-4">
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 font-medium">
                          {preview.length} imagen{preview.length > 1 ? 'es' : ''} seleccionada{preview.length > 1 ? 's' : ''}
                        </p>
                        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                          {preview.map((url, idx) => (
                            <div key={idx} className="relative group">
                              <img src={url} alt={`Preview ${idx + 1}`} className="rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 w-full h-24 object-cover" />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                <span className="text-white text-xs font-semibold">{idx + 1}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {(formData.mediaType === 'reel' || formData.mediaType === 'video') && (
                  <>
                    <div>
                      <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
                        <input
                          type="file"
                          accept="video/*"
                          onChange={(e) => {
                            const file = e.target.files[0]
                            if (file) {
                              setFormData({ ...formData, video: file })
                              setPreview(URL.createObjectURL(file))
                            }
                          }}
                          className="w-full text-sm text-slate-600 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900/20 file:text-blue-700 dark:file:text-blue-400 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/30 cursor-pointer"
                        />
                      </div>
                      {preview && (
                        <div className="mt-4">
                          <video src={preview} controls className="max-w-md rounded-lg shadow-md border border-slate-200 dark:border-slate-700" />
                        </div>
                      )}
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                        Imagen de Portada (Opcional)
                      </label>
                      <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-4 hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0]
                            if (file) {
                              setFormData({ ...formData, coverImage: file })
                            }
                          }}
                          className="w-full text-sm text-slate-600 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-slate-50 dark:file:bg-slate-800 file:text-slate-700 dark:file:text-slate-300 hover:file:bg-slate-100 dark:hover:file:bg-slate-700 cursor-pointer"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider flex items-center space-x-2">
                    <HashtagIcon className="w-4 h-4" />
                    <span>Hashtags</span>
                  </label>
                  <input
                    type="text"
                    value={formData.hashtags}
                    onChange={(e) => setFormData({ ...formData, hashtags: e.target.value })}
                    placeholder="trabajo, empleo, carrera, tecnologia"
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 transition-all"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Separa los hashtags con comas
                  </p>
                </div>
                <div className="flex items-end">
                  <div className="flex items-center space-x-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 w-full">
                    <input
                      type="checkbox"
                      id="autoPublish"
                      checked={formData.autoPublish}
                      onChange={(e) => setFormData({ ...formData, autoPublish: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="autoPublish" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                      Publicación Automatizada
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingOffer(null)
                    setPreview(null)
                  }}
                  className="px-5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="bg-blue-600 dark:bg-blue-700 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition-all duration-200 font-semibold shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Subiendo...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-5 h-5" />
                      <span>{editingOffer ? 'Actualizar' : 'Crear Oferta'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Job Offers List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 dark:border-blue-400 border-t-transparent"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-400 font-medium">Cargando ofertas laborales...</p>
          </div>
        ) : jobOffers.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-700/50">
                <InboxIcon className="w-12 h-12 text-slate-400 dark:text-slate-500" />
              </div>
            </div>
            <p className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">No hay ofertas laborales</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Crea tu primera oferta laboral para comenzar</p>
            <button
              onClick={() => {
                setShowForm(true)
                setEditingOffer(null)
                setFormData({ 
                  title: '', 
                  description: '', 
                  hashtags: '', 
                  autoPublish: false,
                  mediaType: 'image',
                  image: null,
                  video: null,
                  carouselImages: [],
                  coverImage: null
                })
                setPreview(null)
              }}
              className="bg-blue-600 dark:bg-blue-700 text-white px-6 py-3 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition-all font-semibold flex items-center space-x-2 mx-auto shadow-sm hover:shadow-md"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Crear Primera Oferta</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobOffers.map((offer) => (
              <div key={offer._id} className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 border border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2 line-clamp-2">{offer.title}</h3>
                    <div className="flex items-center space-x-2 mb-3">
                      {offer.mediaType === 'image' && <ImageIcon className="w-4 h-4 text-slate-400" />}
                      {offer.mediaType === 'carousel' && <FilmIcon className="w-4 h-4 text-slate-400" />}
                      {(offer.mediaType === 'reel' || offer.mediaType === 'video') && <VideoIcon className="w-4 h-4 text-slate-400" />}
                      <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                        {offer.mediaType === 'image' ? 'Imagen' : offer.mediaType === 'carousel' ? 'Carrusel' : 'Reel'}
                      </span>
                    </div>
                  </div>
                  {offer.published && (
                    <div className="flex items-center space-x-1 px-2.5 py-1 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                      <CheckCircleIcon className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                      <span className="text-xs font-semibold text-green-700 dark:text-green-300">Publicada</span>
                    </div>
                  )}
                </div>
                
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-3 leading-relaxed">
                  {offer.description}
                </p>
                
                {offer.hashtags && offer.hashtags.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-1.5">
                    {offer.hashtags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-md">
                        #{tag}
                      </span>
                    ))}
                    {offer.hashtags.length > 3 && (
                      <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs font-semibold rounded-md">
                        +{offer.hashtags.length - 3}
                      </span>
                    )}
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center space-x-2">
                    <HeartIcon className="w-4 h-4 text-red-500" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Reacciones</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{offer.analytics?.reactions || 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <UsersIcon className="w-4 h-4 text-blue-500" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Candidatos</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{offer.analytics?.interestedCandidates || 0}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => fetchAnalytics(offer._id)}
                    className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center justify-center space-x-1"
                  >
                    <ChartBarIcon className="w-4 h-4" />
                    <span>Analíticas</span>
                  </button>
                  {!offer.published ? (
                    <>
                      <button
                        onClick={() => handlePublish(offer._id, 'post')}
                        className="flex-1 bg-green-600 dark:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 dark:hover:bg-green-800 transition-colors flex items-center justify-center space-x-1 shadow-sm hover:shadow-md"
                        title="Publicar como Post"
                      >
                        <ShareIcon className="w-4 h-4" />
                        <span>Post</span>
                      </button>
                      <button
                        onClick={() => handlePublish(offer._id, 'story')}
                        className="flex-1 bg-purple-600 dark:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-purple-700 dark:hover:bg-purple-800 transition-colors flex items-center justify-center space-x-1 shadow-sm hover:shadow-md"
                        title="Publicar como Story"
                      >
                        <ShareIcon className="w-4 h-4" />
                        <span>Story</span>
                      </button>
                    </>
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
                      className="flex-1 bg-blue-600 dark:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors flex items-center justify-center space-x-1 shadow-sm hover:shadow-md"
                      title="Identificar candidatos interesados"
                    >
                      <UsersIcon className="w-4 h-4" />
                      <span>Buscar</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setEditingOffer(offer)
                      setFormData({
                        title: offer.title,
                        description: offer.description,
                        hashtags: offer.hashtags.join(', '),
                        autoPublish: offer.autoPublish || false,
                        mediaType: offer.mediaType || 'image',
                        image: null,
                        video: null,
                        carouselImages: [],
                        coverImage: null
                      })
                      setShowForm(true)
                    }}
                    className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    title="Editar"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(offer._id)}
                    className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    title="Eliminar"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Analytics Modal */}
      {analytics && selectedOffer && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <ChartBarIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Panel de Analíticas</h2>
            </div>
            <button
              onClick={() => {
                setAnalytics(null)
                setSelectedOffer(null)
              }}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
            <div className="bg-slate-50 dark:bg-slate-700/50 p-5 rounded-lg border border-slate-200 dark:border-slate-600 hover:shadow-md transition-all group">
              <div className="flex items-center space-x-2 mb-2">
                <HeartIcon className="w-5 h-5 text-red-500" />
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Reacciones</p>
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {analytics.interactions.reactions}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 p-5 rounded-lg border border-slate-200 dark:border-slate-600 hover:shadow-md transition-all group">
              <div className="flex items-center space-x-2 mb-2">
                <CommentIcon className="w-5 h-5 text-blue-500" />
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Comentarios</p>
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {analytics.interactions.comments}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 p-5 rounded-lg border border-slate-200 dark:border-slate-600 hover:shadow-md transition-all group">
              <div className="flex items-center space-x-2 mb-2">
                <UsersIcon className="w-5 h-5 text-purple-500" />
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Candidatos</p>
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {analytics.candidates.total}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 p-5 rounded-lg border border-slate-200 dark:border-slate-600 hover:shadow-md transition-all group">
              <div className="flex items-center space-x-2 mb-2">
                <ChartBarIcon className="w-5 h-5 text-amber-500" />
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Total</p>
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {analytics.interactions.total}
              </p>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-5 tracking-tight">Gráfico de Participación</h3>
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }} 
                  />
                  <Legend />
                  <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {analytics.candidates.total > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-5">
                <UsersIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">Candidatos Interesados</h3>
              </div>
              <div className="space-y-3">
                {analytics.candidates.list.slice(0, 10).map((candidate) => (
                  <div key={candidate._id} className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-200 dark:border-slate-600 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all flex items-center justify-between group">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600 dark:bg-blue-700 flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {candidate.instagramHandle?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">@{candidate.instagramHandle}</p>
                        {candidate.name && (
                          <p className="text-sm text-slate-600 dark:text-slate-400">{candidate.name}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Puntuación</p>
                        <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{candidate.engagementScore}</p>
                      </div>
                    </div>
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

