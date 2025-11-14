# Axtronet Instagram CM Agent

Sistema automatizado de Community Manager para Instagram que escucha y responde a interacciones, procesa candidatos y gestiona procesos de selección laboral.

## 🎯 Características

### Funcionalidades Principales
- ✅ **Webhooks de Instagram**: Recepción de eventos en tiempo real (comentarios, menciones, reacciones)
- ✅ **Procesamiento NLP**: Análisis de sentimiento e intención en español
- ✅ **Social Listening**: Monitoreo y análisis de interacciones
- ✅ **Respuestas Automatizadas**: Generación de respuestas contextuales
- ✅ **Gestión de Candidatos**: Seguimiento de interacciones y scoring de engagement
- ✅ **Invitaciones Automáticas**: Sistema de invitación basado en engagement
- ✅ **Inbound Marketing**: Atracción y conversión de candidatos

### Funcionalidades Opcionales
- 📧 **Seguimiento por DM**: Conversaciones personalizadas por mensaje directo
- 📸 **Publicación de Ofertas**: Creación automática de posts de trabajo
- 📊 **Analytics Poblacionales**: Recolección de datos de interés y engagement

## 🚀 Tecnologías

- **Backend**: Node.js + Express
- **NLP**: Natural (tokenización) + Sentiment (análisis de sentimiento)
- **API**: Instagram Graph API
- **Webhooks**: Verificación y procesamiento de eventos de Instagram
- **Storage**: JSON file-based (escalable a BD)

## 📋 Requisitos Previos

- Node.js 14+
- Cuenta de Instagram Business
- Facebook Developer App configurada
- Token de acceso de Instagram Graph API

## ⚙️ Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/felipegtech/Axtronet-empleos---Instagram-Cm.git
cd Axtronet-empleos---Instagram-Cm
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
cp .env.example .env
```

Editar `.env` con tus credenciales:
```env
INSTAGRAM_ACCESS_TOKEN=tu_token_de_acceso
INSTAGRAM_APP_SECRET=tu_app_secret
INSTAGRAM_VERIFY_TOKEN=tu_token_de_verificacion
INSTAGRAM_BUSINESS_ACCOUNT_ID=tu_id_de_cuenta
PORT=3000
```

## 🏃‍♂️ Uso

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm start
```

### Testing
```bash
npm test
```

### Linting
```bash
npm run lint
```

## 📡 Configuración de Webhooks

1. En Facebook Developer Console, configura el webhook:
   - **URL de Callback**: `https://tu-dominio.com/webhook`
   - **Token de Verificación**: El mismo que configuraste en `INSTAGRAM_VERIFY_TOKEN`

2. Suscribirse a los siguientes campos:
   - `comments`
   - `mentions`
   - `story_insights`
   - `messages` (para DMs)

## 🔌 API Endpoints

### Webhook
- `GET /webhook` - Verificación del webhook
- `POST /webhook` - Recepción de eventos de Instagram

### API Pública
- `GET /api/candidates` - Listar todos los candidatos
- `GET /api/candidates/:id` - Obtener candidato por ID
- `POST /api/candidates/:id/invite` - Invitar candidato manualmente
- `POST /api/jobs/post` - Publicar oferta laboral
- `GET /api/stats/engagement` - Estadísticas de engagement

### Health Check
- `GET /health` - Estado del servicio

## 🧠 Procesamiento NLP

El sistema analiza cada interacción para detectar:

- **Sentimiento**: Positivo, negativo o neutral
- **Intención**: Interés laboral, preguntas, menciones generales
- **Tópicos**: Palabras clave relacionadas con trabajo y empleo
- **Entidades**: Emails, teléfonos (extracción básica)

## 📊 Sistema de Scoring

Cada interacción suma puntos de engagement:

| Tipo | Puntos Base | Bonus |
|------|-------------|-------|
| Comentario | 2 | +1 sentimiento positivo |
| Mención | 3 | +2 keywords laborales |
| DM | 4 | +3 muestra interés |
| Vista de Story | 1 | - |

**Umbral de invitación**: 7 puntos (configurable)

## 🎯 Flujo de Trabajo

1. **Usuario interactúa** en Instagram (comenta/menciona/envía DM)
2. **Webhook recibe** el evento
3. **NLP analiza** el contenido
4. **Sistema trackea** la interacción y actualiza score
5. **Respuesta automática** se genera y envía
6. **Si score ≥ umbral**: Se invita al proceso de selección
7. **CM puede revisar** candidatos en `/api/candidates`

## 👥 Usuarios del Sistema

- **Candidatos**: Usuarios de Instagram que interactúan con el contenido
- **Community Managers**: Administran y revisan candidatos vía API

## 🔒 Seguridad

- Validación de webhook con token de verificación
- Variables de entorno para credenciales sensibles
- Validación de eventos de Instagram

## 📈 Roadmap

- [ ] Integración con base de datos (MongoDB/PostgreSQL)
- [ ] Dashboard web para CMs
- [ ] ML para mejor detección de intención
- [ ] Integración con ATS (Applicant Tracking Systems)
- [ ] Notificaciones push para CMs
- [ ] A/B testing de respuestas
- [ ] Análisis demográfico avanzado

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea tu feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT.

## 📧 Contacto

Axtronet - [@axtronet](https://instagram.com/axtronet)

Project Link: [https://github.com/felipegtech/Axtronet-empleos---Instagram-Cm](https://github.com/felipegtech/Axtronet-empleos---Instagram-Cm)

## 🙏 Agradecimientos

- Instagram Graph API Documentation
- Natural NLP Library
- Express.js Community
