# Entrega 3: Automatic Instagram CM

## Tabla de contenido
- [Sección 1: Aspectos generales de la entrega](#sección-1-aspectos-generales-de-la-entrega)
- [Sección 2: Evaluación Sprint anterior](#sección-2-evaluación-sprint-anterior)
- [Sección 3: Planificación Sprint actual](#sección-3-planificación-sprint-actual)
- [Sección 4: Aspectos estructurales y arquitectónicos](#sección-4-aspectos-estructurales-y-arquitectónicos-de-la-solución)
- [Sección 5: Principios y patrones de diseño](#sección-5-principios-y-patrones-de-diseño)
- [Sección 6: Patrones de diseño utilizados](#sección-6-patrones-de-diseño)
- [Sección 7: Funcionalidad y demostración](#sección-7-funcionalidad-y-demostración)
- [Conclusiones y lecciones aprendidas](#conclusiones-y-lecciones-aprendidas)
- [Referencias](#referencias)

---

## Sección 1: Aspectos generales de la entrega

### Introducción
Automatic Instagram CM responde al reto de los product owners de Magneto: un agente que escucha Instagram, clasifica reacciones, responde con guiones aprobados y detecta candidatos potenciales para procesos de selección. Durante esta entrega cerramos la fase de producto funcional con un backend Node.js/Express endurecido para producción, un frontend Vite/React para los community managers y un stack de persistencia en MongoDB Atlas. El documento describe la retrospectiva del sprint previo, la planeación del sprint final, las decisiones arquitectónicas, los principios de diseño aplicados, los patrones utilizados y la demostración técnica necesaria para la valoración del PO bajo metodología Scrum.

---

## Sección 2: Evaluación Sprint anterior

La retrospectiva se realizó con técnica **Start/Stop/Continue** y sesiones de revisión con líder técnico y PO. Principales hallazgos:

- **Falta de hardening en el webhook**: la ausencia de validación HMAC permitía peticiones no confiables.
- **Desalineación entre modelos y eventos reales**: la enumeración de `Interaction.source` no contemplaba DMs, provocando errores silenciosos.
- **Riesgos en detección de interesados**: se almacenaban identificadores de ofertas inconsistentes, afectando la trazabilidad.

Acciones de mejora comprometidas y ejecutadas en este sprint:

| Problema | Acción Correctiva | Resultado |
| --- | --- | --- |
| Webhook sin firma | Integrar verificación con `INSTAGRAM_APP_SECRET` y limitar tasa | Firmas inválidas se rechazan con 401 |
| Modelo de interacciones incompleto | Extender enumeraciones y orquestar guardado de DMs | DMs se registran y visualizan en dashboard |
| Seguimiento a leads débil | Asociar candidatos a `jobOfferId` real y enriquecer analítica | Métricas y candidatos sincronizados |

Daily stand-ups y una weekly con el PO garantizaron seguimiento a los acuerdos y desbloqueo temprano de riesgos (permisos Meta, pruebas de post-publicación).

---

## Sección 3: Planificación Sprint actual

Se priorizaron historias que impactan directamente los objetivos del PO (respuesta automática, publicación, analítica):

| Historia | Objetivo | Estimación (SP) |
| --- | --- | --- |
| HU-08: “Como CM quiero que el webhook rechace solicitudes inválidas para proteger el canal” | Añadir validación criptográfica, rate limiting y logging estructurado | 3 |
| HU-12: “Como PO necesito que el bot registre y clasifique DMs para continuar conversaciones en caliente” | Persistir DMs como interacciones válidas y actualizar candidatos | 5 |
| HU-15: “Como Reclutador quiero identificar candidatos interesados después de publicar una vacante” | Normalizar analítica, enlazar leads a ofertas y exponer endpoint en dashboard | 5 |

Ceremonia de planning con **Planning Poker** en GitHub Projects, validada por el PO. Se actualizó el Sprint Backlog con criterios de aceptación y definición de terminado (DoD): pruebas manuales, registro en `CHANGELOG`, verificación en board y demo funcional.

---

## Sección 4: Aspectos estructurales y arquitectónicos de la solución

### Arquitectura propuesta
El sistema adopta una arquitectura **client/server** con separación en capas. El backend (Express + MongoDB) opera como listener y orquestador: recibe webhooks, procesa NLP, ejecuta auto-replies, publica ofertas y sirve APIs REST consumidas por el frontend. El frontend (Vite + React + Tailwind) ofrece a CMs y reclutadores paneles para interacciones, plantillas, encuestas y analítica. El despliegue objetivo considera un contenedor Node 20 detrás de un proxy TLS, MongoDB Atlas para persistencia y Vite estático en un CDN (por ejemplo, Vercel). La comunicación con Meta se realiza mediante webhooks firmados y endpoints Graph API autenticados con Page Access Token rotado en Settings.

### Resumen de la arquitectura

| Aspecto | Detalle |
| --- | --- |
| Tipo de aplicación | Web client/server con backend headless (API REST + webhooks) |
| Estilos arquitectónicos | Layered, Client/Server, Component-Based, SOA (webhooks), Message-driven |
| Lenguajes | Node.js (ESM), React 18, Tailwind CSS, MongoDB Atlas con Mongoose |
| Persistencia | MongoDB `axtronet-cm-prod` (Atlas) con colecciones `interactions`, `candidates`, `jobOffers`, `surveys`, `settings` |
| Integraciones | Instagram Graph API (webhooks, comments, DMs), Anthropic (futuro), Ngrok/HTTPS para túneles locales |
| DevOps/Observabilidad | Rate limiting, helmet, compression, logging `morgan`, endpoints `/health` y métricas derivadas |

### Vista lógica
- **Interfaz (React/Vite)**: rutas `Dashboard`, `Interactions`, `JobOffers`, `Surveys`, `Candidates`, `AutoReply`, `Settings` consumen APIs con Axios e informan estados críticos (filtros, publicación, DM).
- **Capa de servicios (Express)**: define middlewares de seguridad, orquesta endpoints `/api/*`, gestiona webhooks y publica analítica.
- **Capa de dominio**: servicios específicos (`webhookHandler`, `autoReplyService`, `publishingService`, `instagramService`, `nlpService`) agrupan lógica orientada a negocio.
- **Persistencia**: modelos Mongoose encapsulan validaciones, índices y relaciones (por ejemplo, `Candidate` y `Interaction`).

```38:132:backend/server.js
const env = cleanEnv(process.env, {
  PORT: num({ default: 5000 }),
  FRONTEND_URL: str({ default: 'http://localhost:5173' }),
  MONGODB_URI: str({ default: 'mongodb://127.0.0.1:27017/axtronet-cm-prod' }),
  VERIFY_TOKEN: str({ default: '' }),
  INSTAGRAM_APP_SECRET: str({ default: '' }),
  AUTO_REPLY_ENABLED: bool({ default: true })
}, {
  strict: false
});

const allowedOrigins = FRONTEND_URL.split(',').map(origin => origin.trim()).filter(Boolean);
...
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(compression());
app.use(cors({
  origin: (origin, callback) => {
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      allowedOrigins.includes('*')
    ) {
      return callback(null, true);
    }
    console.warn(`⚠️ Rejected CORS origin: ${origin}`);
    return callback(null, false);
  },
  credentials: true
}));
```

### Vista física
1. **Instagram Graph API** emite eventos firmados (`comments`, `messaging`) al endpoint HTTPS `/webhook`.
2. **Reverse proxy / túnel seguro** (ej. Ngrok en desarrollo, Nginx en producción) enruta tráficos al contenedor Node.js.
3. **Servidor Node.js/Express** valida firma, aplica rate limiting, procesa lógica, persiste en MongoDB Atlas y expone REST.
4. **MongoDB Atlas** almacena configuraciones, interacciones, candidatos, plantillas y métricas.
5. **Frontend Vite/React** consume APIs desde `FRONTEND_URL` autorizado, desplegado en CDN.

### Persistencia
Los modelos se diseñaron para capturar el ciclo del CM:

- `Interaction`: comentario, reacción o DM con metadatos (intención, prioridad, IDs Instagram).
- `Candidate`: historial conversacional, interés en ofertas, reacciones, metadata demográfica.
- `JobOffer` / `Survey`: publicación y analítica enriquecida.
- `Settings`: parámetros de tokens, plantillas y permisos.

```1:66:backend/models/Interaction.js
const interactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['comment', 'reaction'],
    required: true
  },
  ...
  source: {
    type: String,
    enum: ['post', 'story', 'dm'],
    default: 'post'
  },
  ...
});
interactionSchema.index({ 'metadata.instagramCommentId': 1 });
```

```1:112:backend/services/publishingService.js
const interactions = await Interaction.find({
  $or: [
    { postId },
    { 'metadata.instagramPostId': postId }
  ]
});
...
if (!existingInterest && jobOfferId) {
  candidate.jobOfferInterest.push({
    jobOfferId,
    interestLevel: analysis.jobInterest ? 'high' : 'medium',
    interactedAt: interaction.timestamp
  });
}
```

---

## Sección 5: Principios y patrones de diseño

### 5.1 Principios SOLID

| Principio | Aplicación en el proyecto |
| --- | --- |
| Single Responsibility | `webhookHandler.processComment` encapsula el pipeline de comentarios (validaciones, persistencia y delegación del auto-reply) sin mezclar responsabilidades de red ni de publicación ([cita 1](#cita-1)). |
| Open/Closed | Las reglas de auto-reply se extienden mediante plantillas configurables y `calculateTemplateScore`, sin modificar el núcleo al agregar nuevas categorías o palabras clave ([cita 2](#cita-2)). |
| Liskov Substitution | Los servicios consumen modelos Mongoose a través de contratos consistentes; por ejemplo, `identifiyInterestedCandidates` opera con cualquier instancia de `Candidate` que implemente `save()` de Mongoose, garantizando sustitución de subtipos generados (mock vs real) ([cita 3](#cita-3)). |
| Interface Segregation | Los módulos React utilizan endpoints segmentados (`/api/job-offers`, `/api/auto-reply`, `/api/settings`), evitando depender de operaciones no relevantes (los componentes sólo consumen las interfaces que necesitan). |
| Dependency Inversion | Servicios de alto nivel (`publishingService`, `autoReplyService`) dependen de abstracciones (`instagramService`, `nlpService`) y no de detalles concretos de la API de Meta/NLP, permitiendo reemplazos controlados ([cita 4](#cita-4)). |

### 5.2 Patrones GRASP

| Principio | Evidencia |
| --- | --- |
| Experto | `webhookHandler` concentra el conocimiento sobre comentarios Instagram y decide cuándo invocar NLP o auto-reply. |
| Bajo acoplamiento | Los servicios importan modelos de forma localizada y usan `Settings.getSettings()` como fachada para evitar dependencias cíclicas. |
| Alta cohesión | `autoReplyService` agrupa la lógica relacionada con plantillas, smart replies y actualización de candidatos; cada método atiende una variación del mismo propósito. |
| Controlador | El endpoint `/webhook` actúa como controlador del flujo entre Meta y los servicios internos, coordinando DMs, comentarios y reacciones ([cita 5](#cita-5)). |
| Creador | Las factorías `new Interaction`, `new Candidate` se instancian en el módulo que recibe los datos necesarios (webhook), evitando exponer constructores fuera del contexto natural. |
| Polimorfismo | El motor de auto-reply selecciona plantillas en función de reglas y palabras clave, aplicando lógica distinta según categoría de plantilla. |
| Indirección | `instagramService` intermedia el envío de DMs y replies; si Meta cambia la API, sólo ese servicio se ajusta. |
| Variaciones protegidas | El puntaje de candidato y la decisión de DM se gobiernan por templates y reglas; al cambiar criterios no se tocan consumidores finales. |

### 5.3 Clean Code

- Uso consistente de `async/await`, manejo de errores y mensajes descriptivos.
- Configuración centralizada (`cleanEnv`, middlewares) para reducir duplicación.
- Métodos pequeños con nombres autoexplicativos (`replyAsComment`, `generateSmartResponse`).
- Índices y validaciones declarativos en los modelos Mongo.

#### Cita 1 <a id="cita-1"></a>

```1:144:backend/services/webhookHandler.js
const autoReplyResult = await autoReplyService.processInteraction(interaction);
...
await this.createOrUpdateCandidate(username, message, analysis.sentiment, 'comment', null, analysis);
```

#### Cita 2 <a id="cita-2"></a>

```262:308:backend/services/autoReplyService.js
message = message.replace(/{topics}/g,
  (analysis.topics && analysis.topics.length > 0) ? analysis.topics.join(', ') : ''
);
...
return templates.find(template => template.isDefault) || templates[0] || null;
```

#### Cita 3 <a id="cita-3"></a>

```82:198:backend/services/publishingService.js
const interestedCandidates = [];
for (const interaction of interactions) {
  ...
  await candidate.save();
  interestedCandidates.push(candidate);
}
return {
  success: true,
  count: interestedCandidates.length,
  candidates: interestedCandidates
};
```

#### Cita 4 <a id="cita-4"></a>

```139:262:backend/services/instagramService.js
const accessToken = await this.getAccessToken();
...
const result = await instagramService.publishPost(jobOffer.imageUrl, caption, jobOffer.hashtags);
```

#### Cita 5 <a id="cita-5"></a>

```299:349:backend/server.js
if (!verifyInstagramSignature(req)) {
  console.warn('❌ Invalid webhook signature');
  return res.status(401).json({ success: false, message: 'Invalid webhook signature' });
}
console.log('📥 Webhook received:', req.body);
const { object, entry } = req.body;
```

---

## Sección 6: Patrones de diseño

### Patrón 1 – Strategy (Selección inteligente de plantillas)
- **Clasificación**: Comportamiento.
- **Intención**: Elegir dinámicamente la mejor respuesta en función de sentimiento, keywords y prioridad.
- **Aplicabilidad**: Cuando hay múltiples plantillas activas con reglas distintas y se requiere extensibilidad sin tocar el motor.
- **Estructura**: `selectTemplate` itera plantillas, calcula puntaje y retorna la estrategia adecuada, aislando reglas en datos (`AutoReplyTemplate.smartRules`).
- **Participantes**: `AutoReplyTemplate` (estrategias), `autoReplyService` (contexto), `nlpService` (datos de análisis).
- **Colaboraciones**: `autoReplyService` consulta `nlpService`, puntúa plantillas y activa `replyAsComment` o `sendDM`.
- **Consecuencias**: Reduce condicionales rígidos, permite agregar plantillas específicas (ej. “negative feedback”) sin tocar código.
- **Implementación**: archivos `autoReplyService.js` y colección `auto_reply_templates`.
- **Código de ejemplo**:

```405:452:backend/services/autoReplyService.js
const scoredTemplates = templates
  .map(template => ({
    template,
    score: this.calculateTemplateScore(template, scoringContext)
  }))
  .filter(entry => entry.score !== Number.NEGATIVE_INFINITY)
  .sort((a, b) => b.score - a.score);
```

### Patrón 2 – Template Method (Publicaciones en Meta)
- **Clasificación**: Comportamiento.
- **Intención**: Compartir flujo para publicar posts y stories reutilizando pasos comunes (cargar recurso, construir caption, persistir resultado).
- **Aplicabilidad**: Cuando varios procesos comparten la secuencia general con pequeñas variaciones.
- **Estructura**: `publishJobOffer` y `publishSurvey` guardan la plantilla del proceso y delegan variaciones (`publishPost` vs `publishStory`).
- **Participantes**: `publishingService`, `instagramService`, modelos `JobOffer`/`Survey`.
- **Consecuencias**: Minimiza duplicación, facilita añadir nuevos tipos (ej. Reels) reescribiendo sólo secciones específicas.

### Patrón 3 – Factory Method (Configuraciones persistentes)
- **Clasificación**: Creación.
- **Intención**: Garantizar un único documento de configuración y centralizar la creación.
- **Aplicabilidad**: Configs globales que se usan en múltiples servicios.
- **Estructura**: `Settings.getSettings()` crea o recupera el documento sin exponer lógica de persistencia al resto de la aplicación.
- **Participantes**: `Settings` (factory), `instagramService`, `autoReplyService`, `webhookHandler`.
- **Consecuencias**: Simplifica lectura/escritura de configuración y facilita pruebas.

### Patrón 4 – Observer / Event-driven (Webhooks)
- **Clasificación**: Comportamiento.
- **Intención**: Reaccionar a eventos de Instagram sin acoplar lógica a la plataforma.
- **Aplicabilidad**: Siempre que se reciban eventos externos que deban propagar acciones internas.
- **Estructura**: Express actúa como sujeto, `webhookHandler`, `autoReplyService` y `publishingService` son observadores que reaccionan a cambios específicos.
- **Consecuencias**: Aísla la lógica de negocio, permite agregar observadores (ej. métricas) sin modificar el controlador de webhooks.

---

## Sección 7: Funcionalidad y demostración

### Árbol de directorios (extracto)

```
├── backend
│   ├── models
│   ├── routes
│   ├── services
│   └── server.js
└── frontend
    └── src
        ├── App.jsx
        ├── components
        └── pages
```

### Historias implementadas
1. **HU-05**: Responder automáticamente a comentarios con plantillas inteligentes y mover a DM cuando detecta interés.
2. **HU-07**: Publicar ofertas y encuestas en Instagram, registrando analítica y candidatos interesados.
3. **HU-11**: Continuar conversaciones desde el dashboard enviando DMs y actualizando el historial del candidato.

### Flujo demostrado al PO
1. **Configurar entorno**:
   ```bash
   # Backend
   cd backend
   npm install
   cp .env.template .env   # Ver plantilla más abajo
   npm run dev

   # Frontend
   cd ../frontend
   npm install
   npm run dev -- --host
   ```
2. **Verificar health-check**: `GET http://localhost:5000/health`.
3. **Simular publicación**: Crear oferta en UI (`Job Offers`), publicar como Post y verificar actualización de métricas.
4. **Escuchar webhook**: Enviar comentario de prueba (Postman/Graph API Explorer) y observar respuesta automática en consola + dashboard.
5. **Continuar DM**: Desde `Candidates`, seleccionar un usuario y enviar mensaje directo (log de éxito o warning dependiendo de permisos Meta).
6. **Analítica**: Revisar `Dashboard` y `Job Offers > Analytics` para métricas y leads.

### Variables de entorno (crear `backend/.env`)
```
FRONTEND_URL=http://localhost:5173
MONGODB_URI=mongodb+srv://fgomezd1_db_user:7sz7d8VU0z8hbsdc@instagram-cm.lw2y9.mongodb.net/axtronet-cm-prod?retryWrites=true&w=majority&appName=instagram-cm
VERIFY_TOKEN=Fegoda99
INSTAGRAM_APP_ID=1097124025382249
INSTAGRAM_APP_SECRET=6d9206aff56d0a0a9bbfbf89bb17c2c1
INSTAGRAM_PAGE_ID=10682219145427915
INSTAGRAM_PAGE_ACCESS_TOKEN=<token válido>
AUTO_REPLY_ENABLED=true
ANTHROPIC_API_KEY=tu_api_key_aquí
```
**Nota**: El Page Access Token debe generarse desde Meta Developers con los permisos `instagram_manage_messages`, `pages_manage_metadata`, `pages_read_engagement`. Recomendado crear la app desde cero y registrar el webhook desde Facebook Developer Console (producto Instagram > Webhooks).

### Estado integrado frontend/backend
- Axios apunta a `VITE_API_URL=http://localhost:5000`.
- CORS restringido a los orígenes declarados en `FRONTEND_URL`.
- Rate limiting operativo (`/api`: 1000 req / 15 min, `/webhook`: 200 req / min).
- Auto-reply habilitado por defecto y persistido en `Settings`.

---

## Conclusiones y lecciones aprendidas

- La validación criptográfica de webhooks y el endurecimiento de middlewares fueron clave para pasar de un prototipo a un servicio listo para producción.
- Modelar correctamente interacciones de DMs y alinear los identificadores con las ofertas permitió cumplir el objetivo del PO: identificar leads accionables y continuar conversaciones en caliente.
- Documentar las plantillas de auto-reply como datos configurables facilita que producto y negocio ajusten el tono sin intervención de desarrollo.
- Se consolidó un backlog técnico claro (automatización de pruebas, despliegue CI/CD, integración con Anthropic) para iteraciones posteriores.

---

## Referencias

- Meta for Developers. (2024). *Instagram Graph API*. https://developers.facebook.com/docs/instagram-api/
- Meta for Developers. (2024). *Webhooks for Instagram*. https://developers.facebook.com/docs/graph-api/webhooks/
- OWASP Foundation. (2023). *Secrets Management Cheat Sheet*. https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html
- Microsoft. (2024). *Node.js application architecture guidance*. https://learn.microsoft.com/en-us/training/paths/build-node-apps/
- W3C. (2023). *Web Content Accessibility Guidelines (WCAG) 2.2*. https://www.w3.org/TR/WCAG22/
- Traversy Media. (2024). *TypeScript Crash Course* [Video]. YouTube.
- AXA Group. (2024). *NLP.js Documentation*. https://github.com/axa-group/nlp.js


