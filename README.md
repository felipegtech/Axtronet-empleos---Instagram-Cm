# Axtronet-empleos---Instagram-Cm
Aplicativo para publicar ofertas laborales, automatizar interacción con usuarios y gestionar campañas de atracción de talento.

## Automatic Instagram CM – Entrega Final
Solución full-stack que cumple los requerimientos del Product Owner de Magneto:

1. **Continuar conversaciones por DM** luego de detectar interés en comentarios o reacciones.
2. **Publicar ofertas laborales automáticamente** (post o story) e identificar candidatos interesados.
3. **Publicar encuestas y contenidos de interés**, recolectando información poblacional y de bienestar.

El backend (Node.js/Express/MongoDB) expone webhooks verificados criptográficamente, servicios de auto-reply, publicación y analítica.  
El frontend (React/Vite/Tailwind) ofrece dashboard integral para CMs y reclutadores.

---

### 1. Requisitos previos
- Node.js ≥ 18  
- npm ≥ 9  
- Cuenta de Meta Developers con permisos `instagram_manage_messages`, `pages_manage_metadata`, `pages_read_engagement`  
- Proyecto en MongoDB Atlas  

---

### 2. Configuración de credenciales
En `backend/.env`:

