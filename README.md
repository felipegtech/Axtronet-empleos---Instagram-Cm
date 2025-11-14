## Automatic Instagram CM – Entrega Final

Solución full-stack que cumple los requerimientos del Product Owner de Magneto:

1. **Continuar conversaciones por DM** luego de detectar interés en comentarios o reacciones.
2. **Publicar ofertas laborales automáticamente** (post o story) e identificar candidatos interesados.
3. **Publicar encuestas y contenidos de interés** recolectando información poblacional y de bienestar.

El backend (Node.js/Express/MongoDB) expone webhooks verificados criptográficamente, servicios de auto-reply, publicación y analítica. El frontend (React/Vite/Tailwind) ofrece dashboard integral para CMs y reclutadores.

---

### 1. Requisitos previos

- Node.js ≥ 18
- npm ≥ 9
- Cuenta de **Meta Developers** con permisos `instagram_manage_messages`, `pages_manage_metadata`, `pages_read_engagement`.
- Proyecto en **MongoDB Atlas** (o base compatible).

---

### 2. Configuración de credenciales

1. En `backend/.env` (ya creado), completa:
   ```
   FRONTEND_URL=http://localhost:5173
   MONGODB_URI=<cadena Mongo Atlas>
   VERIFY_TOKEN=Fegoda99
   INSTAGRAM_APP_ID=1097124025382249
   INSTAGRAM_APP_SECRET=6d9206aff56d0a0a9bbfbf89bb17c2c1
   INSTAGRAM_PAGE_ID=10682219145427915
   INSTAGRAM_PAGE_ACCESS_TOKEN=<token con permisos vigentes>
   AUTO_REPLY_ENABLED=true
   ANTHROPIC_API_KEY=<opcional>
   ```
   > **Nota:** si generas una nueva app limpia de Meta, reemplaza los IDs/tokens por los tuyos y vuelve a suscribir el webhook.

2. (Opcional) para el frontend crea `frontend/.env.local`:
   ```
   VITE_API_URL=http://localhost:5000
   ```

---

### 3. Instalación

```bash
git clone https://github.com/your-org/Axtronet-automatic-instagram-cm.git
cd Axtronet-automatic-instagram-cm

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

---

### 4. Ejecución en desarrollo

```bash
# Terminal 1 – Backend
cd backend
npm run dev

# Terminal 2 – Frontend
cd frontend
npm run dev -- --host
```

- Backend: http://localhost:5000  
- Frontend: http://localhost:5173  
- Health check: `GET /health`

Expose el backend con Ngrok (HTTPS) para registrar el webhook en Meta:
```bash
ngrok http 5000
```
Añade la URL pública a Meta Developers (Instagram → Webhooks).

---

### 5. Funcionalidades clave listas para producción

| Requisito PO | Implementación |
| --- | --- |
| Continuar conversación por DM | `autoReplyService.sendDM` y `/api/candidates/:id/continue-dm` envían mensajes directos; las respuestas se logran desde `frontend/pages/Candidates.jsx`. |
| Publicar ofertas & detectar interés | `POST /api/job-offers/:id/publish-instagram` publica con `instagramService`. Después se ejecuta `publishingService.identifyInterestedCandidates` para actualizar leads y métricas. UI en `JobOffers.jsx`. |
| Publicar encuestas / contenido de interés | `Survey.jsx` y `publishingService.publishSurvey` permiten publicar encuestas, guardando respuestas y demografía. |
| Escucha y respuesta automática | `/webhook` valida firmas (HMAC SHA-256) y orquesta `webhookHandler` + `autoReplyService`. Se evitan loops, duplicados y se prioriza. |
| Analítica y seguimiento | Endpoints `/api/stats`, `/api/job-offers/:id/analytics`, dashboards en `Dashboard.jsx`. |

Hardening realizado:
- Rate limiting (`/api`, `/webhook`), `helmet`, `compression`, `morgan`.
- `cleanEnv` valida variables obligatorias.
- Mongoose reconecta automáticamente; logs controlados.
- Interacciones DM almacenadas con `source: 'dm'` y candidatos asociados a ofertas reales.

---

### 6. Flujos recomendados de validación

1. **Webhook**: Comentario real en Instagram → ver réplica automática en la publicación (si `AUTO_REPLY_ENABLED=true`) y registro en `Interactions`.
2. **DM**: Simula interés → bot abre DM; desde dashboard enviar mensaje personalizado con `/api/candidates/:id/continue-dm`.
3. **Publicación**: Crear oferta → publicar → esperar 5–10 s → ejecutar “Identificar candidatos” y revisar métricas.
4. **Encuestas**: Crear encuesta → publicar como story/post → registrar respuestas y demografía.

---

### 7. Despliegue sugerido

| Componente | Recomendación |
| --- | --- |
| Backend | Node 20 + PM2 / Docker en Railway, Fly.io o AWS ECS. Configurar HTTPS tras proxy (Nginx, Cloudflare). |
| Base de datos | MongoDB Atlas (nivel M10+ con IP allowlist). |
| Frontend | `npm run build` y desplegar en Vercel/Netlify. Establecer `VITE_API_URL` al dominio del backend. |
| Automatización | Añadir pipeline CI/CD (GitHub Actions) con lint y tests para backend/frontend. |

---

### 8. Documentación ampliada

- `docs/Entrega3.md`: documento formal para el PO (historias, arquitectura, principios y demo).
- `CONFIGURACION_TOKEN.md`: guía rápida para configurar tokens de Meta desde interfaz o `.env`.

---

### 9. Soporte

Para dudas adicionales documenta issues o escribe a `devops@axtronet.com`. Mantén tokens y credenciales cifrados según políticas OWASP Secrets Management. Actualiza el Page Access Token periódicamente (Meta expira tokens de corto plazo). 

¡Listo para producción! Ajusta branding, copy y plantillas según las directrices de marketing. 
