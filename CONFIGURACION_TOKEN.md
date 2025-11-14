# 🔑 Configuración del Token de Instagram

## Problema Actual
El sistema no puede responder automáticamente a los comentarios porque falta el **Page Access Token** de Instagram.

## Solución: Configurar el Token

### Opción 1: Desde la Interfaz Web (Recomendado)

1. Ve a **Settings** → **Instagram API**
2. En el campo **"Page Access Token"**, pega tu token
3. El sistema guardará automáticamente cuando salgas del campo
4. Verás un mensaje verde "✅ Token configurado correctamente"

### Opción 2: Desde el archivo .env

1. Abre el archivo `.env` en la raíz del proyecto
2. Agrega o actualiza esta línea:
   ```
   INSTAGRAM_PAGE_ACCESS_TOKEN=tu_token_aqui
   ```
3. Reinicia el servidor

## Cómo Obtener el Token

### Método 1: Facebook Graph API Explorer

1. Ve a: https://developers.facebook.com/tools/explorer/
2. Selecciona tu app de Facebook/Instagram
3. Selecciona el permiso: `instagram_basic`, `pages_show_list`, `pages_read_engagement`
4. Genera el token
5. Copia el token y pégalo en Settings

### Método 2: Desde tu App de Facebook

1. Ve a: https://developers.facebook.com/apps/
2. Selecciona tu app
3. Ve a **Tools** → **Graph API Explorer**
4. Genera un **Page Access Token** con los permisos necesarios
5. Copia el token

## Verificación

Después de configurar el token:

1. Reinicia el servidor backend
2. Envía un comentario de prueba a tu post de Instagram
3. Revisa los logs del servidor - deberías ver:
   ```
   ✅ Token obtenido desde Settings (MongoDB)
   ✅ Respuesta automática enviada exitosamente a Instagram!
   ```

## Notas Importantes

- El token debe tener permisos para **responder a comentarios**
- El token puede expirar - si ves errores 401, genera uno nuevo
- El token se guarda en MongoDB (Settings) o en `.env`
- El sistema prioriza el token de Settings sobre el de `.env`

