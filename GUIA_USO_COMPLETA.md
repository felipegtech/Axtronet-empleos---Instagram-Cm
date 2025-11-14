# 📘 Guía Completa de Uso - Automatic Instagram CM

## 🚀 Cómo Subir y Publicar Contenido

### 1. **Configurar Token de Instagram**

1. Ve a **Configuración → Instagram API**
2. Obtén tu Page Access Token desde [Facebook Graph API Explorer](https://developers.facebook.com/tools/explorer/)
3. Pega el token en el campo "Page Access Token"
4. Haz clic en **"Validar"** - el sistema verificará y guardará el token automáticamente
5. Verás la información del token: estado, expiración, permisos, etc.

### 2. **Crear una Oferta Laboral**

1. Ve a **Ofertas Laborales → + Crear Oferta Laboral**

2. **Completa los datos básicos:**
   - Título (requerido)
   - Descripción (requerido)
   - Hashtags (separados por comas)

3. **Selecciona el Tipo de Media:**
   - **Imagen**: Para un post simple con una imagen
   - **Carrusel**: Para un post con 2-10 imágenes
   - **Reel/Video**: Para publicar un video o reel

4. **Sube los archivos:**
   - **Para Imagen**: Selecciona una imagen (JPG, PNG, etc.)
   - **Para Carrusel**: Selecciona 2-10 imágenes
   - **Para Reel**: Selecciona un video (MP4) y opcionalmente una imagen de portada

5. **Preview automático**: Verás una vista previa del contenido antes de guardar

6. **Haz clic en "Crear"**: 
   - El sistema subirá los archivos automáticamente
   - Guardará la oferta en la base de datos
   - Los archivos se almacenarán en `backend/uploads/jobOffers/`

### 3. **Publicar en Instagram**

1. En la lista de ofertas, encuentra la oferta que quieres publicar
2. Haz clic en **"📱 Post"** o **"📸 Story"**
3. El sistema:
   - Leerá los archivos desde el servidor
   - Los subirá a Instagram Graph API
   - Publicará el contenido
   - Guardará el Post ID de Instagram
   - Obtendrá insights automáticamente (después de 10 segundos)

### 4. **Flujo Completo de Upload y Publicación**

```
Frontend (React)
    ↓
1. Usuario selecciona archivo(s)
    ↓
2. handleFileUpload() → POST /api/upload/image|video|images
    ↓
Backend (Express + Multer)
    ↓
3. Multer guarda archivo en backend/uploads/jobOffers/
    ↓
4. MediaFile guardado en MongoDB con path y URL
    ↓
5. Respuesta con { path, url, id }
    ↓
Frontend
    ↓
6. handleSubmit() → POST /api/job-offers con payload incluyendo paths
    ↓
Backend
    ↓
7. JobOffer guardado en MongoDB con imagePath/videoPath/carouselImages
    ↓
Usuario hace clic en "Publicar"
    ↓
8. handlePublish() → POST /api/job-offers/:id/publish-instagram
    ↓
Backend → PublishingService
    ↓
9. Lee archivos desde paths guardados
    ↓
10. InstagramService.publishPost/Carousel/Reel()
    ↓
11. Sube archivos a Instagram Graph API usando FormData
    ↓
12. Instagram publica el contenido
    ↓
13. Guarda instagramPostId y obtiene insights
```

## 📁 Estructura de Archivos

```
backend/
  uploads/
    jobOffers/
      imagen-1234567890.jpg
      video-1234567891.mp4
      carousel-1234567892.jpg
      ...
    general/
      ...
```

## 🔧 Endpoints de Upload

- `POST /api/upload/image` - Subir una imagen
- `POST /api/upload/images` - Subir múltiples imágenes (carrusel)
- `POST /api/upload/video` - Subir un video
- `GET /uploads/:type/:filename` - Servir archivos estáticos

## 📤 Publicación a Instagram

- `POST /api/job-offers/:id/publish-instagram` - Publicar oferta
- `GET /api/instagram/posts/:postId/insights` - Obtener insights
- `POST /api/job-offers/:id/identify-candidates` - Identificar candidatos

## ✅ Verificación

1. **Verifica que los archivos se suban:**
   - Revisa la consola del navegador (F12)
   - Deberías ver: `📤 Subiendo imagen...` y `✅ Imagen subida:`
   - Revisa `backend/uploads/jobOffers/` - deberían aparecer los archivos

2. **Verifica que se guarden en la BD:**
   - Revisa MongoDB - colección `joboffers`
   - Deberías ver `imagePath`, `videoPath`, o `carouselImages` con las rutas

3. **Verifica la publicación:**
   - Revisa la consola del backend
   - Deberías ver logs detallados del proceso de publicación
   - El Post ID de Instagram se guardará en `instagramPostId`

## 🐛 Solución de Problemas

### Error: "Archivo no encontrado"
- Verifica que el directorio `backend/uploads/` exista
- Verifica permisos de escritura
- Revisa que el path en la BD sea correcto

### Error: "Token inválido"
- Ve a Settings → Instagram API
- Valida el token nuevamente
- Verifica que tenga los permisos necesarios

### Error al publicar
- Verifica que el token tenga permisos: `instagram_basic`, `pages_manage_posts`, `instagram_manage_comments`
- Verifica que los archivos existan en el servidor
- Revisa los logs del backend para más detalles

## 🎯 Características Implementadas

✅ Upload de imágenes individuales
✅ Upload de múltiples imágenes (carruseles)
✅ Upload de videos/reels
✅ Preview de contenido antes de guardar
✅ Publicación real a Instagram Graph API
✅ Obtención automática de insights
✅ Identificación de candidatos
✅ Logging completo de webhooks
✅ Validación de tokens
✅ Refresh de tokens (long-lived)

¡Todo está listo para usar! 🎉

