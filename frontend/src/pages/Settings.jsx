import { useState, useEffect } from 'react'
import axios from 'axios'
import { SettingsIcon } from '../components/Icons'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function Settings() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('instagram')
  const [newMember, setNewMember] = useState({
    email: '',
    role: 'viewer',
    permissions: {
      canManageJobs: false,
      canManageSurveys: false,
      canReplyToMessages: false,
      canViewAnalytics: true
    }
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/settings`)
      setSettings(response.data.data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching settings:', error)
      setLoading(false)
    }
  }

  const updateInstagramSettings = async (data) => {
    try {
      await axios.put(`${API_BASE_URL}/api/settings/instagram`, data)
      fetchSettings()
      alert('¡Configuración de Instagram actualizada exitosamente!')
    } catch (error) {
      console.error('Error updating Instagram settings:', error)
      alert('Error al actualizar la configuración')
    }
  }

  const updateNotificationSettings = async (data) => {
    try {
      await axios.put(`${API_BASE_URL}/api/settings/notifications`, data)
      fetchSettings()
      alert('¡Configuración de notificaciones actualizada exitosamente!')
    } catch (error) {
      console.error('Error updating notification settings:', error)
      alert('Error al actualizar la configuración')
    }
  }

  const addTeamMember = async () => {
    if (!newMember.email) {
      alert('Por favor ingresa una dirección de correo')
      return
    }

    try {
      await axios.post(`${API_BASE_URL}/api/settings/team/members`, newMember)
      setNewMember({
        email: '',
        role: 'viewer',
        permissions: {
          canManageJobs: false,
          canManageSurveys: false,
          canReplyToMessages: false,
          canViewAnalytics: true
        }
      })
      fetchSettings()
      alert('¡Miembro del equipo agregado exitosamente!')
    } catch (error) {
      console.error('Error adding team member:', error)
      alert('Error al agregar el miembro del equipo')
    }
  }

  const removeTeamMember = async (email) => {
    if (!confirm('¿Estás seguro de eliminar este miembro del equipo?')) return

    try {
      await axios.delete(`${API_BASE_URL}/api/settings/team/members/${email}`)
      fetchSettings()
      alert('¡Miembro del equipo eliminado exitosamente!')
    } catch (error) {
      console.error('Error removing team member:', error)
      alert('Error al eliminar el miembro del equipo')
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Cargando configuración...</p>
      </div>
    )
  }

  if (!settings) {
    return <div className="text-center py-8 text-gray-500">Configuración no encontrada</div>
  }

  const tabs = [
    { id: 'instagram', label: '🔑 Instagram API', icon: '🔑' },
    { id: 'webhook', label: '🌐 Webhook', icon: '🌐' },
    { id: 'auto-reply', label: '🤖 Auto-Reply', icon: '🤖' },
    { id: 'notifications', label: '🔔 Notifications', icon: '🔔' },
    { id: 'team', label: '👨‍👩‍👧‍👦 Team Access', icon: '👨‍👩‍👧‍👦' }
  ]

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-slate-200 dark:border-slate-700">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center">
            <SettingsIcon className="w-8 h-8 mr-3 text-blue-600 dark:text-blue-400" />
            Configuración
          </h1>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-slate-700 mb-6">
          <div className="flex space-x-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Instagram API Integration */}
        {activeTab === 'instagram' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Integración de API de Instagram</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Token de API
                  </label>
                  <input
                    type="password"
                    defaultValue={settings.instagram?.apiToken || ''}
                    onBlur={(e) => updateInstagramSettings({ apiToken: e.target.value })}
                    placeholder="Enter Instagram API token"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Page Access Token <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    defaultValue={settings.instagram?.pageAccessToken || ''}
                    onBlur={(e) => updateInstagramSettings({ pageAccessToken: e.target.value })}
                    placeholder="Ingresa tu Page Access Token de Instagram"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      !settings.instagram?.pageAccessToken 
                        ? 'border-red-300 bg-red-50' 
                        : 'border-gray-300'
                    }`}
                  />
                  {!settings.instagram?.pageAccessToken && (
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">
                        <strong>⚠️ Requerido para Auto-Reply:</strong> Este token es necesario para que el sistema pueda responder automáticamente a los comentarios de Instagram.
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        Obtén tu token en: <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="underline">Facebook Graph API Explorer</a>
                      </p>
                    </div>
                  )}
                  {settings.instagram?.pageAccessToken && (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">
                        ✅ Token configurado correctamente
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="connected"
                    checked={settings.instagram?.connected || false}
                    onChange={(e) => updateInstagramSettings({ connected: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="connected" className="text-sm text-gray-700">
                    Conectado a Instagram
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Webhook Configuration */}
        {activeTab === 'webhook' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Configuración de Webhook</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    URL del Webhook
                  </label>
                  <input
                    type="text"
                    defaultValue={settings.instagram?.webhookUrl || ''}
                    onBlur={(e) => updateInstagramSettings({ webhookUrl: e.target.value })}
                    placeholder="https://yourdomain.com/webhook"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Current webhook endpoint: {window.location.origin}/webhook
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Secreto del Webhook
                  </label>
                  <input
                    type="password"
                    defaultValue={settings.instagram?.webhookSecret || ''}
                    onBlur={(e) => updateInstagramSettings({ webhookSecret: e.target.value })}
                    placeholder="Enter webhook secret"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Token de Verificación
                  </label>
                  <input
                    type="text"
                    defaultValue={settings.instagram?.verifyToken || ''}
                    onBlur={(e) => updateInstagramSettings({ verifyToken: e.target.value })}
                    placeholder="Enter verify token"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Auto-Reply Settings */}
        {activeTab === 'auto-reply' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Configuración de Auto-Respuesta</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="autoReplyEnabled"
                    checked={settings.autoReply?.enabled === true}
                    onChange={async (e) => {
                      try {
                        const newValue = e.target.checked;
                        console.log(`Cambiando auto-reply a: ${newValue}`);
                        await axios.put(`${API_BASE_URL}/api/settings/auto-reply`, { 
                          enabled: newValue 
                        });
                        // Actualizar estado local inmediatamente
                        setSettings(prev => ({
                          ...prev,
                          autoReply: {
                            ...prev.autoReply,
                            enabled: newValue
                          }
                        }));
                        alert(`✅ Auto-reply ${newValue ? 'habilitado' : 'deshabilitado'} exitosamente!`);
                      } catch (error) {
                        console.error('Error updating auto-reply:', error);
                        alert(`❌ Error al actualizar auto-reply: ${error.message}`);
                      }
                    }}
                    className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <label htmlFor="autoReplyEnabled" className="text-sm text-gray-700 font-medium cursor-pointer">
                    Habilitar Auto-Reply Automático
                  </label>
                  {settings.autoReply?.enabled && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                      ✅ Activo
                    </span>
                  )}
                  {!settings.autoReply?.enabled && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      ⏸️ Inactivo
                    </span>
                  )}
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>💡 Información:</strong> Cuando está habilitado, el sistema responderá automáticamente a todos los comentarios nuevos en Instagram con el mensaje configurado.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notification Preferences */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Preferencias de Notificaciones</h2>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="notificationsEnabled"
                    checked={settings.notifications?.enabled || false}
                    onChange={(e) => updateNotificationSettings({ enabled: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="notificationsEnabled" className="text-sm text-gray-700">
                    Habilitar Notificaciones
                  </label>
                </div>
                <div className="pl-6 space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="notifyDMs"
                      checked={settings.notifications?.types?.dms || false}
                      onChange={(e) => updateNotificationSettings({
                        types: { ...settings.notifications.types, dms: e.target.checked }
                      })}
                      className="mr-2"
                    />
                    <label htmlFor="notifyDMs" className="text-sm text-gray-700">
                      Mensajes Directos
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="notifyComments"
                      checked={settings.notifications?.types?.comments || false}
                      onChange={(e) => updateNotificationSettings({
                        types: { ...settings.notifications.types, comments: e.target.checked }
                      })}
                      className="mr-2"
                    />
                    <label htmlFor="notifyComments" className="text-sm text-gray-700">
                      Comentarios
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="notifyReactions"
                      checked={settings.notifications?.types?.reactions || false}
                      onChange={(e) => updateNotificationSettings({
                        types: { ...settings.notifications.types, reactions: e.target.checked }
                      })}
                      className="mr-2"
                    />
                    <label htmlFor="notifyReactions" className="text-sm text-gray-700">
                      Reacciones
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="notifyFlagged"
                      checked={settings.notifications?.types?.flagged || false}
                      onChange={(e) => updateNotificationSettings({
                        types: { ...settings.notifications.types, flagged: e.target.checked }
                      })}
                      className="mr-2"
                    />
                    <label htmlFor="notifyFlagged" className="text-sm text-gray-700">
                      Reacciones Marcadas
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Correo para Notificaciones
                  </label>
                  <input
                    type="email"
                    defaultValue={settings.notifications?.email || ''}
                    onBlur={(e) => updateNotificationSettings({ email: e.target.value })}
                    placeholder="email@example.com"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Team Access Control */}
        {activeTab === 'team' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Control de Acceso del Equipo</h2>
              
              {/* Add New Member */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="text-lg font-semibold mb-3">Agregar Miembro del Equipo</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      Correo *
                    </label>
                    <input
                      type="email"
                      value={newMember.email}
                      onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                      placeholder="member@example.com"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      Role
                    </label>
                    <select
                      value={newMember.role}
                      onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="viewer">Visualizador</option>
                      <option value="manager">Administrador</option>
                      <option value="admin">Super Administrador</option>
                    </select>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Permisos
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newMember.permissions.canManageJobs}
                        onChange={(e) => setNewMember({
                          ...newMember,
                          permissions: { ...newMember.permissions, canManageJobs: e.target.checked }
                        })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Gestionar Trabajos</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newMember.permissions.canManageSurveys}
                        onChange={(e) => setNewMember({
                          ...newMember,
                          permissions: { ...newMember.permissions, canManageSurveys: e.target.checked }
                        })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Gestionar Encuestas</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newMember.permissions.canReplyToMessages}
                        onChange={(e) => setNewMember({
                          ...newMember,
                          permissions: { ...newMember.permissions, canReplyToMessages: e.target.checked }
                        })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Responder Mensajes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newMember.permissions.canViewAnalytics}
                        onChange={(e) => setNewMember({
                          ...newMember,
                          permissions: { ...newMember.permissions, canViewAnalytics: e.target.checked }
                        })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Ver Analíticas</span>
                    </label>
                  </div>
                </div>
                <button
                  onClick={addTeamMember}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Agregar Miembro
                </button>
              </div>

              {/* Team Members List */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Miembros del Equipo</h3>
                {settings.team?.members?.length > 0 ? (
                  <div className="space-y-3">
                    {settings.team.members.map((member, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 p-4 rounded-lg flex items-center justify-between"
                      >
                        <div>
                          <p className="font-semibold text-gray-800">{member.email}</p>
                          <p className="text-sm text-gray-600">
                            Rol: <span className="capitalize">{member.role}</span>
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {Object.entries(member.permissions || {})
                              .filter(([_, value]) => value)
                              .map(([key, _]) => (
                                <span key={key} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  {key.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}
                                </span>
                              ))}
                          </div>
                        </div>
                        <button
                          onClick={() => removeTeamMember(member.email)}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Aún no hay miembros del equipo</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Settings

