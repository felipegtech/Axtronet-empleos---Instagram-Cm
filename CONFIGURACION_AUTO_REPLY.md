# 🤖 Configuración de Auto-Respuesta a Comentarios

## 📋 Requisitos para que el Agente Responda Automáticamente

Para que el sistema responda automáticamente a los comentarios de Instagram, necesitas configurar los siguientes elementos:

---

## ✅ 1. Token de Instagram (Page Access Token) - **OBLIGATORIO**

### ¿Qué es?
El token de acceso que permite al sistema responder a comentarios usando la API de Instagram.

### ¿Dónde configurarlo?

#### Opción A: Desde la Interfaz Web (Recomendado)
1. Ve a **Settings** → **Instagram API**
2. En el campo **"Page Access Token"**, pega tu token
3. El sistema guardará automáticamente cuando salgas del campo
4. Verás un mensaje verde "✅ Token configurado correctamente"

#### Opción B: Desde el archivo `.env`
1. Abre el archivo `.env` en la raíz del proyecto
2. Agrega o actualiza esta línea:
   ```env
   INSTAGRAM_PAGE_ACCESS_TOKEN=tu_token_aqui
   ```
3. Reinicia el servidor backend

### ¿Cómo obtener el token?

1. **Ve a Facebook Developers**: https://developers.facebook.com/apps/
2. **Selecciona tu app de Instagram**
3. **Ve a Tools → Graph API Explorer**
4. **Genera un Page Access Token** con los siguientes permisos:
   - `instagram_basic`
   - `pages_show_list`
   - `pages_read_engagement`
   - `pages_manage_posts` (para responder a comentarios)
   - `instagram_manage_comments` (para responder a comentarios)
5. **Copia el token** y pégalo en Settings o `.env`

### ⚠️ Permisos Necesarios del Token
- ✅ `instagram_basic` - Acceso básico a Instagram
- ✅ `pages_show_list` - Listar páginas conectadas
- ✅ `pages_read_engagement` - Leer interacciones
- ✅ `pages_manage_posts` - Gestionar publicaciones
- ✅ `instagram_manage_comments` - **Responder a comentarios** (OBLIGATORIO)

---

## ✅ 2. Auto-Reply Habilitado en Settings - **OBLIGATORIO**

### ¿Qué es?
La configuración que activa o desactiva el sistema de auto-respuesta.

### ¿Dónde configurarlo?

#### Opción A: Desde la Interfaz Web
1. Ve a **Settings** → **Auto-Reply**
2. Activa el toggle **"Auto-Reply Enabled"**
3. El sistema guardará automáticamente

#### Opción B: Automático
- El sistema habilita automáticamente el auto-reply si no está configurado
- Se crea con `enabled: true` por defecto

### Verificación
```javascript
// El sistema verifica automáticamente:
if (!settings.autoReply?.enabled) {
  console.log('⏸️ Auto-reply está deshabilitado en Settings');
  return { shouldReply: false, reason: 'auto-reply disabled' };
}
```

---

## ✅ 3. Templates de Respuesta Activos - **OBLIGATORIO**

### ¿Qué es?
Los templates de respuesta que el sistema usa para generar mensajes automáticos.

### ¿Dónde configurarlos?

#### Opción A: Creación Automática
- El sistema crea automáticamente un template por defecto si no existe ninguno
- Template por defecto: `"¡Gracias por comentar! 😊"`

#### Opción B: Desde la Interfaz Web
1. Ve a **Settings** → **Auto-Reply Templates**
2. Crea un nuevo template o edita uno existente
3. Activa el template (toggle **"Is Active"**)
4. Configura las reglas de activación (keywords, sentiment, etc.)

### Template por Defecto
```javascript
{
  name: 'Respuesta General por Defecto',
  template: '¡Gracias por comentar! 😊',
  category: 'general',
  isActive: true,
  isDefault: true,
  smartRules: {
    keywords: [],
    sentiment: 'any',
    triggerOn: 'always'
  }
}
```

### Verificación
```javascript
// El sistema verifica automáticamente:
let activeTemplates = await AutoReplyTemplate.find({ isActive: true });
if (activeTemplates.length === 0) {
  await this.createDefaultTemplate();
  activeTemplates = await AutoReplyTemplate.find({ isActive: true });
}
```

---

## ✅ 4. Webhook Configurado y Suscrito - **OBLIGATORIO**

### ¿Qué es?
El endpoint que recibe notificaciones de Instagram cuando hay nuevos comentarios.

### ¿Dónde configurarlo?

#### Paso 1: Configurar ngrok (Desarrollo)
1. **Descarga ngrok**: https://ngrok.com/download
2. **Ejecuta ngrok**:
   ```bash
   ngrok http 5000
   ```
3. **Copia la URL HTTPS** de ngrok (ejemplo: `https://abc123.ngrok.io`)

#### Paso 2: Configurar el Webhook en Meta Developers
1. **Ve a Facebook Developers**: https://developers.facebook.com/apps/
2. **Selecciona tu app de Instagram**
3. **Ve a Instagram → Webhooks**
4. **Agrega el webhook**:
   - **URL del webhook**: `https://tu-url-ngrok.ngrok.io/webhook`
   - **VERIFY_TOKEN**: Debe coincidir con el de tu `.env` o Settings
   - **Suscribe los eventos**:
     - ✅ `comments` - **OBLIGATORIO para auto-respuesta**
     - ✅ `reactions` - Opcional
     - ✅ `messaging` - Opcional (para DMs)

#### Paso 3: Verificar el Webhook
1. **Haz clic en "Verify and Save"**
2. El sistema debe responder con el `VERIFY_TOKEN`
3. Verás un mensaje verde "✅ Webhook verificado"

### Configuración en `.env`
```env
VERIFY_TOKEN=tu_verify_token_aqui
INSTAGRAM_APP_SECRET=tu_app_secret_aqui
```

### Verificación
- El sistema verifica automáticamente la firma del webhook
- Si la firma no coincide, el webhook se rechaza

---

## ✅ 5. MongoDB Funcionando - **OBLIGATORIO**

### ¿Qué es?
La base de datos donde se guardan las interacciones, templates y configuración.

### ¿Dónde configurarlo?

#### Opción A: Docker Compose (Recomendado)
1. El sistema levanta MongoDB automáticamente con Docker Compose
2. Verifica que MongoDB esté corriendo:
   ```bash
   docker compose ps mongo
   ```

#### Opción B: MongoDB Atlas (Producción)
1. Crea una cuenta en MongoDB Atlas
2. Crea un cluster
3. Obtén la cadena de conexión
4. Configúrala en `.env`:
   ```env
   MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/axtronet-cm
   ```

### Verificación
```javascript
// El sistema verifica automáticamente:
if (mongoose.connection.readyState !== 1) {
  console.error('❌ MongoDB no está conectado');
  return;
}
```

---

## ✅ 6. URL Pública del Webhook (HTTPS) - **OBLIGATORIO**

### ¿Qué es?
La URL pública a la que Instagram envía las notificaciones de comentarios.

### ¿Dónde configurarlo?

#### Desarrollo (usando ngrok)
1. **Ejecuta ngrok**:
   ```bash
   ngrok http 5000
   ```
2. **Copia la URL HTTPS** (ejemplo: `https://abc123.ngrok.io`)
3. **Configura el webhook en Meta Developers** con esta URL

#### Producción
1. **Configura un dominio propio** con SSL (HTTPS)
2. **Configura el webhook** con la URL de producción:
   - Ejemplo: `https://api.tudominio.com/webhook`

### ⚠️ Requisitos
- ✅ Debe ser HTTPS (no HTTP)
- ✅ Debe ser accesible públicamente
- ✅ Debe responder a `POST /webhook`
- ✅ Debe verificar la firma del webhook

---

## ✅ 7. Permisos de Instagram API - **OBLIGATORIO**

### ¿Qué es?
Los permisos que tu app de Instagram necesita para responder a comentarios.

### ¿Dónde configurarlo?

#### Paso 1: En Facebook Developers
1. **Ve a Facebook Developers**: https://developers.facebook.com/apps/
2. **Selecciona tu app de Instagram**
3. **Ve a App Review → Permissions and Features**
4. **Solicita los siguientes permisos**:
   - ✅ `instagram_basic` - Acceso básico a Instagram
   - ✅ `pages_show_list` - Listar páginas conectadas
   - ✅ `pages_read_engagement` - Leer interacciones
   - ✅ `pages_manage_posts` - Gestionar publicaciones
   - ✅ `instagram_manage_comments` - **Responder a comentarios** (OBLIGATORIO)

#### Paso 2: Aprobar los Permisos
1. **Envía tu app para revisión** (si es necesario)
2. **Facebook revisará tu app**
3. **Una vez aprobada**, los permisos estarán disponibles

### ⚠️ Notas Importantes
- Algunos permisos requieren revisión de Facebook
- Los permisos pueden tardar varios días en ser aprobados
- Asegúrate de tener una descripción clara del uso de los permisos

---

## ✅ 8. Backend Funcionando - **OBLIGATORIO**

### ¿Qué es?
El servidor backend que procesa los webhooks y envía las respuestas.

### ¿Dónde configurarlo?

#### Opción A: Docker Compose (Recomendado)
1. **Ejecuta el script de inicio**:
   ```bash
   # Linux/Mac
   ./run.sh
   
   # Windows
   run.bat
   ```
2. **Verifica que el backend esté corriendo**:
   ```bash
   docker compose ps backend
   ```

#### Opción B: Manual
1. **Navega a la carpeta backend**:
   ```bash
   cd backend
   ```
2. **Instala las dependencias**:
   ```bash
   npm install
   ```
3. **Inicia el servidor**:
   ```bash
   npm run dev
   ```

### Verificación
```bash
# Health check
curl http://localhost:5000/health

# Debe responder:
{
  "status": "ok",
  "mongodb": "connected"
}
```

---

## 📊 Checklist de Verificación

Usa este checklist para verificar que todo esté configurado correctamente:

- [ ] **Token de Instagram configurado** (Settings o `.env`)
- [ ] **Auto-reply habilitado** (Settings → Auto-Reply)
- [ ] **Templates de respuesta activos** (al menos uno)
- [ ] **Webhook configurado** (Meta Developers → Instagram → Webhooks)
- [ ] **Webhook suscrito a eventos** (`comments` obligatorio)
- [ ] **Webhook verificado** (botón "Verify and Save")
- [ ] **MongoDB funcionando** (Docker Compose o Atlas)
- [ ] **URL pública del webhook** (ngrok en desarrollo, dominio en producción)
- [ ] **Permisos de Instagram API** (solicitados y aprobados)
- [ ] **Backend funcionando** (servidor corriendo)
- [ ] **VERIFY_TOKEN configurado** (Settings o `.env`)
- [ ] **INSTAGRAM_APP_SECRET configurado** (Settings o `.env`)

---

## 🧪 Prueba de Funcionamiento

### Paso 1: Verificar Configuración
1. **Abre el frontend**: http://localhost:5173
2. **Ve a Settings → Instagram API**
3. **Verifica que el token esté configurado**
4. **Ve a Settings → Auto-Reply**
5. **Verifica que el auto-reply esté habilitado**

### Paso 2: Probar el Webhook
1. **Publica un post en Instagram** (desde tu cuenta conectada)
2. **Haz un comentario de prueba** en el post
3. **Revisa los logs del backend**:
   ```bash
   docker compose logs -f backend
   ```
4. **Deberías ver**:
   ```
   ✅ Comment ID encontrado: 123456789
   🔄 ========== INICIANDO AUTO-REPLY ==========
   ✅ Auto-reply está HABILITADO
   ✅ Es un comentario nuevo, procesando...
   📤 Enviando respuesta...
   ✅ RESPUESTA ENVIADA EXITOSAMENTE A INSTAGRAM!
   ```

### Paso 3: Verificar la Respuesta
1. **Ve a Instagram** (app o web)
2. **Abre el post donde comentaste**
3. **Deberías ver la respuesta automática** debajo de tu comentario

---

## 🐛 Solución de Problemas

### Problema: "Token no configurado"
**Solución**:
1. Verifica que el token esté en Settings o `.env`
2. Reinicia el servidor backend
3. Verifica que el token tenga los permisos necesarios

### Problema: "Auto-reply deshabilitado"
**Solución**:
1. Ve a Settings → Auto-Reply
2. Activa el toggle "Auto-Reply Enabled"
3. Guarda los cambios

### Problema: "No hay templates activos"
**Solución**:
1. El sistema crea automáticamente un template por defecto
2. Si no se crea, ve a Settings → Auto-Reply Templates
3. Crea un nuevo template y actívalo

### Problema: "Webhook no recibido"
**Solución**:
1. Verifica que el webhook esté configurado en Meta Developers
2. Verifica que el webhook esté suscrito a `comments`
3. Verifica que la URL del webhook sea HTTPS
4. Verifica que ngrok esté corriendo (en desarrollo)

### Problema: "Comment ID no disponible"
**Solución**:
1. Verifica que el webhook esté recibiendo el `comment_id`
2. Revisa los logs del backend para ver la estructura del webhook
3. Verifica que el webhook esté configurado correctamente

### Problema: "Error 401: Unauthorized"
**Solución**:
1. El token puede haber expirado
2. Genera un nuevo token en Facebook Developers
3. Actualiza el token en Settings o `.env`
4. Reinicia el servidor backend

### Problema: "Error 403: Forbidden"
**Solución**:
1. El token no tiene los permisos necesarios
2. Solicita los permisos en Facebook Developers
3. Espera a que Facebook apruebe los permisos
4. Genera un nuevo token con los permisos aprobados

---

## 📝 Flujo Completo de Auto-Respuesta

1. **Usuario comenta en Instagram** → Instagram envía webhook al backend
2. **Backend recibe webhook** → Verifica la firma del webhook
3. **WebhookHandler procesa comentario** → Crea interacción en MongoDB
4. **AutoReplyService procesa interacción** → Verifica configuración
5. **Sistema busca template apropiado** → Selecciona template basado en reglas
6. **Sistema genera mensaje personalizado** → Reemplaza variables del template
7. **Sistema envía respuesta a Instagram** → Usa Instagram Graph API
8. **Sistema marca interacción como respondida** → Actualiza MongoDB
9. **Usuario ve respuesta en Instagram** → Respuesta aparece en el comentario

---

## 🎯 Resumen de Requisitos

| Requisito | Obligatorio | Dónde Configurarlo |
|-----------|-------------|-------------------|
| **Token de Instagram** | ✅ Sí | Settings o `.env` |
| **Auto-reply habilitado** | ✅ Sí | Settings → Auto-Reply |
| **Templates activos** | ✅ Sí | Settings → Auto-Reply Templates |
| **Webhook configurado** | ✅ Sí | Meta Developers → Instagram → Webhooks |
| **Webhook suscrito a `comments`** | ✅ Sí | Meta Developers → Instagram → Webhooks |
| **MongoDB funcionando** | ✅ Sí | Docker Compose o Atlas |
| **URL pública del webhook (HTTPS)** | ✅ Sí | ngrok (desarrollo) o dominio (producción) |
| **Permisos de Instagram API** | ✅ Sí | Facebook Developers → App Review |
| **Backend funcionando** | ✅ Sí | Docker Compose o manual |
| **VERIFY_TOKEN configurado** | ✅ Sí | Settings o `.env` |
| **INSTAGRAM_APP_SECRET configurado** | ✅ Sí | Settings o `.env` |

---

## ✅ Verificación Final

Una vez que hayas configurado todos los requisitos:

1. **Publica un post en Instagram**
2. **Haz un comentario de prueba**
3. **Revisa los logs del backend**:
   ```bash
   docker compose logs -f backend
   ```
4. **Verifica que la respuesta aparezca en Instagram**

Si todo funciona correctamente, deberías ver:
- ✅ Comentario recibido en los logs
- ✅ Auto-reply procesado
- ✅ Respuesta enviada a Instagram
- ✅ Respuesta visible en Instagram

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs del backend
2. Verifica el checklist de verificación
3. Consulta la sección de solución de problemas
4. Revisa la documentación de Instagram Graph API

---

¡Listo! 🎉 Si todos los requisitos están configurados, el sistema responderá automáticamente a los comentarios de Instagram.

