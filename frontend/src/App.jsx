import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import axios from 'axios'
import Dashboard from './components/Dashboard'
import Interactions from './pages/Interactions'
import JobOffers from './pages/JobOffers'
import Surveys from './pages/Surveys'
import Candidates from './pages/Candidates'
import AutoReply from './pages/AutoReply'
import Settings from './pages/Settings'
import { 
  DashboardIcon, 
  InteractionsIcon, 
  JobOffersIcon, 
  SurveysIcon, 
  CandidatesIcon, 
  AutoReplyIcon, 
  SettingsIcon,
  MoonIcon,
  SunIcon
} from './components/Icons'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function Navigation({ darkMode, setDarkMode }) {
  const location = useLocation()
  const [newInteractionsCount, setNewInteractionsCount] = useState(0)

  useEffect(() => {
    // Fetch new interactions count
    const fetchNewCount = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/interactions?limit=100`)
        // Count interactions from last hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
        const recent = response.data.data.filter(i => new Date(i.timestamp) > oneHourAgo)
        setNewInteractionsCount(recent.length)
      } catch (error) {
        console.error('Error fetching interactions count:', error)
      }
    }
    fetchNewCount()
    const interval = setInterval(fetchNewCount, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [])

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    localStorage.setItem('darkMode', newDarkMode.toString())
    if (newDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const navItems = [
    { path: '/', label: 'Panel', icon: DashboardIcon, badge: null },
    { path: '/interactions', label: 'Interacciones', icon: InteractionsIcon, badge: newInteractionsCount },
    { path: '/job-offers', label: 'Ofertas Laborales', icon: JobOffersIcon, badge: null },
    { path: '/surveys', label: 'Encuestas', icon: SurveysIcon, badge: null },
    { path: '/candidates', label: 'Candidatos', icon: CandidatesIcon, badge: null },
    { path: '/auto-reply', label: 'Auto-Respuesta', icon: AutoReplyIcon, badge: null },
    { path: '/settings', label: 'Configuración', icon: SettingsIcon, badge: null }
  ]

  return (
    <nav className="bg-slate-900 dark:bg-slate-950 shadow-lg mb-8 border-b border-slate-800 dark:border-slate-900">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center space-x-3 group transition-opacity hover:opacity-90">
            <div className="relative">
              <span className="text-3xl font-bold tracking-tight text-white">
                <span className="text-blue-400">A</span>xtronet
              </span>
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
            </div>
            <div className="hidden md:block">
              <div className="text-xs text-slate-400 font-medium uppercase tracking-widest">
                Administrador de Comunidad
              </div>
            </div>
          </Link>
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1 bg-slate-800 dark:bg-slate-900 p-1 rounded-lg">
              {navItems.map((item) => {
                const IconComponent = item.icon
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`relative px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                      location.pathname === item.path
                        ? 'text-white bg-blue-600 dark:bg-blue-700'
                        : 'text-slate-300 dark:text-slate-400 hover:bg-slate-700 dark:hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <IconComponent className="w-5 h-5" />
                    <span className="hidden sm:inline">{item.label}</span>
                    {item.badge !== null && item.badge > 0 && (
                      <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full font-semibold min-w-[20px] text-center">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
            <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-slate-700 dark:border-slate-800">
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg text-slate-300 dark:text-slate-400 hover:bg-slate-700 dark:hover:bg-slate-800 hover:text-white transition-colors"
                title={darkMode ? 'Modo Claro' : 'Modo Oscuro'}
              >
                {darkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
              </button>
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-blue-600 dark:bg-blue-700 flex items-center justify-center cursor-pointer hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors">
                  <span className="text-white font-semibold text-sm">CM</span>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-slate-900 dark:border-slate-950 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

function Footer() {
  return (
    <footer className="mt-16 bg-slate-900 dark:bg-slate-950 text-slate-400 dark:text-slate-500 py-8 border-t border-slate-800 dark:border-slate-900">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <div className="text-sm font-medium">
            © 2025 <span className="text-blue-400 font-semibold">Axtronet</span> CM · Todos los derechos reservados
          </div>
          <div className="text-sm font-medium flex items-center space-x-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <span>Versión 1.0.0 · Plataforma de Administrador de Comunidad</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

function App() {
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    // Check for dark mode preference on mount
    const isDark = localStorage.getItem('darkMode') === 'true'
    setDarkMode(isDark)
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col transition-colors duration-200">
        <Navigation darkMode={darkMode} setDarkMode={setDarkMode} />
        <div className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/interactions" element={<Interactions />} />
            <Route path="/job-offers" element={<JobOffers />} />
            <Route path="/surveys" element={<Surveys />} />
            <Route path="/candidates" element={<Candidates />} />
            <Route path="/auto-reply" element={<AutoReply />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  )
}

export default App
