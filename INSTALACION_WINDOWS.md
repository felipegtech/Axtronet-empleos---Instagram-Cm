# 🪟 Guía de Instalación Rápida en Windows

## 🚀 Inicio Rápido

### Opción 1: Ejecutar run.bat (Recomendado para principiantes)

1. **Haz doble clic en `run.bat`**
2. El script verificará e instalará Docker automáticamente si es necesario
3. Los servicios se levantarán automáticamente

### Opción 2: Ejecutar run.ps1 (PowerShell)

1. **Abre PowerShell** (clic derecho → "Ejecutar como administrador")
2. **Navega a la carpeta del proyecto**
   ```powershell
   cd C:\ruta\a\Axtronet-automatic-instagram-cm-main
   ```
3. **Ejecuta el script**
   ```powershell
   .\run.ps1
   ```

---

## 📋 Qué hace el script automáticamente

### 1. ✅ Verifica e Instala Docker Desktop

- **Si Docker no está instalado:**
  - Descarga Docker Desktop automáticamente
  - Te ofrece ejecutar el instalador
  - Te recuerda reiniciar después de instalar

- **Si Docker Desktop no está corriendo:**
  - Lo inicia automáticamente
  - Espera a que esté listo (hasta 3 minutos)

### 2. ✅ Verifica Docker Compose

- Docker Compose viene incluido con Docker Desktop
- El script verifica que esté disponible

### 3. ✅ Verifica Configuración

- Crea archivo `.env` desde `.env.example` si no existe
- Te recuerda configurar las variables necesarias

### 4. ✅ Levanta los Servicios

- Detiene contenedores existentes
- Construye las imágenes de Docker
- Levanta MongoDB, Backend y Frontend
- Espera a que todos estén listos

### 5. ✅ Muestra Estado y URLs

- Tabla con el estado de todos los servicios
- URLs para acceder a cada servicio
- Comandos útiles para gestionar los servicios

---

## ⚙️ Requisitos Previos

### Automático (Recomendado)

El script instala todo automáticamente, pero necesitas:

- **Windows 10/11** (64-bit)
- **Conexión a Internet** (para descargar Docker Desktop)
- **Permisos de Administrador** (recomendado para instalar Docker)

### Manual (Si prefieres instalar tú mismo)

1. **Docker Desktop para Windows**
   - Descarga desde: https://www.docker.com/products/docker-desktop/
   - Instala Docker Desktop
   - Reinicia tu computadora
   - Inicia Docker Desktop

2. **PowerShell 5.1 o superior**
   - Windows 10/11 viene con PowerShell preinstalado
   - Si no lo tienes: https://aka.ms/powershell

---

## 🔧 Configuración Inicial

### 1. Configurar Variables de Entorno

Edita el archivo `.env` con tus credenciales:

```env
# MongoDB
MONGODB_URI=mongodb://axtronet_admin:change_me_please@mongo:27017/axtronet_cm?authSource=admin
MONGO_INITDB_ROOT_USERNAME=axtronet_admin
MONGO_INITDB_ROOT_PASSWORD=change_me_please

# Backend
PORT=5000
FRONTEND_URL=http://localhost:5173
FRONTEND_PORT=5173

# Instagram API
INSTAGRAM_PAGE_ACCESS_TOKEN=tu_token_aqui
INSTAGRAM_APP_ID=tu_app_id
INSTAGRAM_APP_SECRET=tu_app_secret
INSTAGRAM_PAGE_ID=tu_page_id
VERIFY_TOKEN=tu_verify_token

# Frontend
VITE_API_URL=http://localhost:5000
```

### 2. Obtener Token de Instagram

Consulta `CONFIGURACION_TOKEN.md` para obtener tu token de Instagram.

---

## 🐛 Solución de Problemas

### Error: "PowerShell no está disponible"

**Solución:**
1. Instala PowerShell desde: https://aka.ms/powershell
2. O ejecuta `run.ps1` manualmente desde PowerShell

### Error: "Política de ejecución de scripts"

**Solución:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

O ejecuta:
```powershell
powershell -ExecutionPolicy Bypass -File run.ps1
```

### Error: "Docker no está instalado"

**Solución:**
1. El script te ofrecerá instalarlo automáticamente
2. O descarga Docker Desktop manualmente desde: https://www.docker.com/products/docker-desktop/
3. Instala Docker Desktop y reinicia tu computadora
4. Vuelve a ejecutar el script

### Error: "Docker Desktop no está corriendo"

**Solución:**
1. El script te ofrecerá iniciarlo automáticamente
2. O inicia Docker Desktop manualmente desde el menú de inicio
3. Espera a que Docker Desktop esté listo (verás el ícono en la bandeja del sistema)
4. Vuelve a ejecutar el script

### Error: "Puerto ya en uso"

**Solución:**
1. Verifica qué proceso está usando el puerto:
   ```powershell
   netstat -ano | findstr :5000
   ```
2. Detén el proceso o cambia el puerto en `.env`

### Error: "MongoDB no está respondiendo"

**Solución:**
1. Espera unos minutos más (MongoDB puede tardar en iniciar)
2. Verifica los logs:
   ```powershell
   docker compose logs mongo
   ```
3. Reinicia los servicios:
   ```powershell
   docker compose restart mongo
   ```

### Error: "Backend no está respondiendo"

**Solución:**
1. Espera unos minutos más (el backend puede tardar en iniciar)
2. Verifica los logs:
   ```powershell
   docker compose logs backend
   ```
3. Verifica que MongoDB esté corriendo:
   ```powershell
   docker compose ps mongo
   ```
4. Reinicia los servicios:
   ```powershell
   docker compose restart backend
   ```

---

## 📊 Comandos Útiles

### Ver Logs
```powershell
docker compose logs -f              # Todos los servicios
docker compose logs -f backend      # Solo backend
docker compose logs -f mongo        # Solo MongoDB
docker compose logs -f frontend     # Solo frontend
```

### Detener Servicios
```powershell
docker compose down                 # Detener y eliminar contenedores
docker compose stop                 # Solo detener contenedores
```

### Reiniciar Servicios
```powershell
docker compose restart              # Reiniciar todos
docker compose restart backend      # Reiniciar solo backend
docker compose restart mongo        # Reiniciar solo MongoDB
```

### Ver Estado
```powershell
docker compose ps                   # Estado de los servicios
docker compose ps backend           # Estado del backend
docker compose ps mongo             # Estado de MongoDB
```

### Reconstruir Imágenes
```powershell
docker compose build                # Reconstruir todas las imágenes
docker compose build backend        # Reconstruir solo backend
docker compose build frontend       # Reconstruir solo frontend
```

### Limpiar Todo
```powershell
docker compose down -v              # Detener y eliminar contenedores y volúmenes
docker system prune -a              # Limpiar todo (¡cuidado! elimina todo)
```

---

## 🌐 Acceso a los Servicios

Una vez que los servicios estén corriendo, puedes acceder a:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health
- **Webhook**: http://localhost:5000/webhook
- **MongoDB**: mongodb://localhost:27017

---

## ✅ Checklist de Verificación

- [ ] Docker Desktop instalado y corriendo
- [ ] PowerShell disponible
- [ ] Archivo `.env` configurado
- [ ] Token de Instagram configurado
- [ ] Servicios levantados correctamente
- [ ] Frontend accesible en http://localhost:5173
- [ ] Backend accesible en http://localhost:5000
- [ ] Health check respondiendo correctamente
- [ ] MongoDB respondiendo correctamente

---

## 🚀 Próximos Pasos

1. **Abre el frontend en tu navegador**
   - http://localhost:5173

2. **Configura el token de Instagram**
   - Ve a Settings → Instagram API
   - Ingresa tu INSTAGRAM_PAGE_ACCESS_TOKEN

3. **Configura ngrok para el webhook**
   - Descarga ngrok desde: https://ngrok.com/download
   - Ejecuta: `ngrok http 5000`
   - Copia la URL HTTPS de ngrok

4. **Configura el webhook en Meta Developers**
   - Ve a https://developers.facebook.com/apps/
   - Selecciona tu app de Instagram
   - Ve a Instagram → Webhooks
   - Agrega la URL del webhook: `https://tu-url-ngrok.ngrok.io/webhook`
   - Configura el VERIFY_TOKEN
   - Suscribe los eventos: `comments`, `reactions`, `messaging`

5. **Prueba el sistema**
   - Crea una oferta laboral
   - Publica en Instagram
   - Haz un comentario de prueba
   - Verifica que se reciba el webhook

---

## 📞 Soporte

Para más ayuda, consulta:
- `README.md` - Documentación principal
- `README_WINDOWS.md` - Guía completa para Windows
- `CONFIGURACION_TOKEN.md` - Guía de configuración de tokens
- `PRODUCTION_CHECKLIST.md` - Checklist de producción
- `VERIFICACION_FINAL.md` - Verificación final

---

¡Listo! 🎉 El sistema está funcionando correctamente en Windows.

