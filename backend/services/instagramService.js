import axios from 'axios';

const INSTAGRAM_API_URL = 'https://graph.instagram.com';

class InstagramService {
  // Validar y limpiar token
  validateAndCleanToken(token) {
    if (!token) {
      return null;
    }
    
    // Limpiar espacios en blanco
    let cleanedToken = token.trim();
    
    // Remover caracteres de nueva línea o retorno de carro
    cleanedToken = cleanedToken.replace(/\r?\n|\r/g, '');
    
    // Remover espacios extras
    cleanedToken = cleanedToken.replace(/\s+/g, '');
    
    // Validar formato básico (debe tener al menos 50 caracteres)
    if (cleanedToken.length < 50) {
      console.error('   ⚠️ Token parece ser demasiado corto o inválido');
      return null;
    }
    
    // Validar que no tenga caracteres especiales problemáticos
    if (/[<>"{}[\]\\]/.test(cleanedToken)) {
      console.error('   ⚠️ Token contiene caracteres especiales no permitidos');
      return null;
    }
    
    // Validar formato del token (debe empezar con EAAP o EAA para Page Access Token)
    // Nota: Algunos tokens pueden tener formato diferente, así que solo validamos formato básico
    if (!/^[A-Za-z0-9]+$/.test(cleanedToken)) {
      console.error('   ⚠️ Token contiene caracteres no alfanuméricos');
      return null;
    }
    
    // Advertencia si el token no empieza con el formato esperado
    if (!cleanedToken.startsWith('EAAP') && !cleanedToken.startsWith('EAA')) {
      console.warn('   ⚠️ ADVERTENCIA: El token no tiene el formato esperado de Page Access Token');
      console.warn('   💡 Los tokens de Instagram normalmente empiezan con EAAP... o EAA...');
      console.warn('   💡 El token puede no ser válido. Verifica que sea un Page Access Token válido.');
      // No retornamos null, solo advertimos, porque algunos tokens pueden tener formato diferente
    }
    
    return cleanedToken;
  }
  
  // Obtener el token de acceso desde Settings o .env
  async getAccessToken() {
    try {
      // Primero intentar desde Settings (MongoDB)
      const Settings = (await import('../models/Settings.js')).default;
      const settings = await Settings.getSettings();
      
      if (settings.instagram?.pageAccessToken) {
        const cleanedToken = this.validateAndCleanToken(settings.instagram.pageAccessToken);
        if (cleanedToken) {
          console.log('   ✅ Token obtenido desde Settings (MongoDB)');
          console.log(`   🔑 Token length: ${cleanedToken.length} caracteres`);
          console.log(`   🔑 Token preview: ${cleanedToken.substring(0, 20)}...`);
          return cleanedToken;
        } else {
          console.error('   ❌ Token en Settings está mal formateado o inválido');
        }
      }
      
      // Si no está en Settings, usar .env
      const tokenFromEnv = process.env.INSTAGRAM_PAGE_ACCESS_TOKEN;
      if (tokenFromEnv) {
        const cleanedToken = this.validateAndCleanToken(tokenFromEnv);
        if (cleanedToken) {
          console.log('   ✅ Token obtenido desde .env');
          console.log(`   🔑 Token length: ${cleanedToken.length} caracteres`);
          console.log(`   🔑 Token preview: ${cleanedToken.substring(0, 20)}...`);
          return cleanedToken;
        } else {
          console.error('   ❌ Token en .env está mal formateado o inválido');
        }
      }
      
      // Si no está en ningún lado
      console.error('   ❌ Token no encontrado en Settings ni en .env');
      return null;
    } catch (error) {
      console.error('   ⚠️ Error obteniendo token:', error.message);
      // Fallback a .env
      const tokenFromEnv = process.env.INSTAGRAM_PAGE_ACCESS_TOKEN;
      if (tokenFromEnv) {
        return this.validateAndCleanToken(tokenFromEnv);
      }
      return null;
    }
  }
  // Simular publicación de post
  async publishPost(imageUrl, caption, hashtags = []) {
    try {
      // En producción, esto usaría la API real de Instagram
      // Por ahora simulamos la respuesta
      const hashtagsString = hashtags.map(tag => `#${tag}`).join(' ');
      const fullCaption = `${caption}\n\n${hashtagsString}`;
      
      const postId = `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('📤 Publishing post to Instagram:', {
        postId,
        caption: fullCaption,
        imageUrl
      });
      
      return {
        success: true,
        postId,
        permalink: `https://www.instagram.com/p/${postId}/`,
        caption: fullCaption
      };
    } catch (error) {
      console.error('Error publishing post:', error);
      throw error;
    }
  }

  // Simular publicación de story
  async publishStory(imageUrl, stickerData = null) {
    try {
      const storyId = `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('📱 Publishing story to Instagram:', {
        storyId,
        imageUrl,
        stickerData
      });
      
      return {
        success: true,
        storyId,
        imageUrl
      };
    } catch (error) {
      console.error('Error publishing story:', error);
      throw error;
    }
  }

  // Obtener Instagram Business Account ID
  async getInstagramBusinessAccountId() {
    try {
      const accessToken = await this.getAccessToken();
      if (!accessToken) {
        throw new Error('Access token no disponible');
      }

      // Obtener la página de Facebook asociada
      const pageResponse = await axios.get(`https://graph.facebook.com/v18.0/me/accounts`, {
        params: {
          access_token: accessToken,
          fields: 'instagram_business_account'
        }
      });

      if (pageResponse.data.data && pageResponse.data.data.length > 0) {
        const page = pageResponse.data.data[0];
        if (page.instagram_business_account) {
          return page.instagram_business_account.id;
        }
      }

      // Si no se encuentra, intentar obtener directamente desde el token
      const meResponse = await axios.get(`https://graph.facebook.com/v18.0/me`, {
        params: {
          access_token: accessToken,
          fields: 'instagram_business_account'
        }
      });

      if (meResponse.data.instagram_business_account?.id) {
        return meResponse.data.instagram_business_account.id;
      }

      return null;
    } catch (error) {
      console.error('Error obteniendo Instagram Business Account ID:', error.response?.data || error.message);
      return null;
    }
  }

  // Obtener ID de usuario desde username (requiere que el usuario haya iniciado conversación)
  async getUserIdFromUsername(username) {
    try {
      // Nota: Instagram Graph API no permite buscar usuarios por username directamente
      // Solo podemos obtener IDs de usuarios que ya han iniciado conversación con nosotros
      // Por ahora retornamos el username como está y usaremos el endpoint de mensajes
      return username;
    } catch (error) {
      console.error('Error obteniendo user ID:', error);
      return username;
    }
  }

  // Enviar mensaje directo (DM) usando Instagram Graph API
  async sendDirectMessage(recipientIdOrUsername, message) {
    try {
      console.log('\n   📩 [SEND-DM] Iniciando envío de mensaje directo...');
      console.log(`   Destinatario: ${recipientIdOrUsername}`);
      console.log(`   Mensaje: "${message.substring(0, 50)}..."`);

      const accessToken = await this.getAccessToken();
      
      if (!accessToken) {
        console.error('❌ INSTAGRAM_PAGE_ACCESS_TOKEN no está configurado');
        throw new Error('Instagram Page Access Token no configurado. Por favor, configúralo en Settings → Instagram API.');
      }

      // Obtener Instagram Business Account ID
      const igBusinessAccountId = await this.getInstagramBusinessAccountId();
      
      if (!igBusinessAccountId) {
        console.warn('⚠️ No se pudo obtener Instagram Business Account ID');
        console.warn('   Esto puede ser normal si el token no tiene permisos o la cuenta no está vinculada');
        console.warn('   Intentando enviar DM de todas formas...');
      }

      // Instagram Graph API endpoint para enviar DMs
      // POST https://graph.facebook.com/v18.0/{ig-user-id}/messages
      // Requiere: recipient (objeto con id), message (objeto con text)
      
      // IMPORTANTE: Para enviar DMs, necesitamos:
      // 1. El usuario debe haber iniciado conversación primero (Instagram no permite iniciar DMs)
      // 2. O usar el ID de Instagram del usuario (no username)
      
      // Intentar enviar usando el endpoint de mensajes
      let url;
      if (igBusinessAccountId) {
        url = `https://graph.facebook.com/v18.0/${igBusinessAccountId}/messages`;
      } else {
        // Fallback: intentar con el token directamente
        url = `https://graph.facebook.com/v18.0/me/messages`;
      }

      console.log(`   📤 URL: ${url}`);
      console.log(`   Intentando enviar DM...`);

      // Formato requerido por Instagram Graph API para mensajes
      const messageData = {
        recipient: {
          // Si es un ID numérico, usarlo; si no, intentar como username
          id: recipientIdOrUsername.match(/^\d+$/) ? recipientIdOrUsername : recipientIdOrUsername
        },
        message: {
          text: message
        }
      };

      let response;
      try {
        const formData = new URLSearchParams();
        formData.append('recipient', JSON.stringify(messageData.recipient));
        formData.append('message', JSON.stringify(messageData.message));
        formData.append('access_token', accessToken);

        response = await axios.post(url, formData.toString(), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });

        console.log(`   ✅ DM enviado exitosamente!`);
        console.log(`   Message ID: ${response.data.message_id || 'N/A'}`);
        
        return {
          success: true,
          messageId: response.data.message_id || `msg_${Date.now()}`,
          recipientId: recipientIdOrUsername,
          message,
          timestamp: new Date(),
          instagramResponse: response.data
        };
      } catch (error) {
        // Si falla, puede ser porque:
        // 1. El usuario no ha iniciado conversación
        // 2. Necesitamos el ID numérico del usuario
        // 3. El token no tiene permisos para enviar DMs
        
        console.error('   ❌ Error enviando DM:', error.response?.data || error.message);
        
        if (error.response) {
          console.error('   Status:', error.response.status);
          console.error('   Data:', JSON.stringify(error.response.data, null, 2));
          
          // Mensajes de error específicos
          if (error.response.status === 400) {
            const errorData = error.response.data;
            if (errorData.error?.message?.includes('recipient')) {
              console.error('   💡 El usuario no ha iniciado conversación con tu cuenta');
              console.error('   💡 Instagram requiere que el usuario envíe el primer mensaje');
              throw new Error('No se puede enviar DM: El usuario debe iniciar la conversación primero. Instagram solo permite responder a mensajes existentes.');
            }
          } else if (error.response.status === 403) {
            console.error('   💡 El token no tiene permisos para enviar DMs');
            console.error('   💡 Necesitas permisos: instagram_manage_messages, pages_messaging');
            throw new Error('No tienes permisos para enviar DMs. Verifica los permisos del token en Facebook Developers.');
          }
        }

        // Si falla completamente, registrar pero no lanzar error crítico
        console.warn('   ⚠️ No se pudo enviar DM, pero el sistema continuará funcionando');
        
        // Retornar respuesta simulada para que el sistema no se rompa
        return {
          success: false,
          messageId: `msg_sim_${Date.now()}`,
          recipientId: recipientIdOrUsername,
          message,
          timestamp: new Date(),
          warning: 'DM no enviado: El usuario debe iniciar conversación primero o verifica permisos del token',
          error: error.response?.data?.error?.message || error.message
        };
      }
    } catch (error) {
      console.error('❌ Error crítico enviando DM:', error.message);
      throw error;
    }
  }

  // Verificar si el token es válido haciendo una petición de prueba
  async verifyToken(accessToken, throwError = false) {
    try {
      // Intentar obtener información básica del token usando diferentes endpoints
      // Método 1: Intentar con /me (funciona para Page Access Tokens)
      try {
        const response = await axios.get('https://graph.facebook.com/v18.0/me', {
          params: {
            access_token: accessToken,
            fields: 'id,name'
          },
          timeout: 10000
        });
        
        if (response.data && response.data.id) {
          console.log('   ✅ Token verificado correctamente');
          console.log(`   📋 Usuario/Página ID: ${response.data.id}`);
          console.log(`   📋 Nombre: ${response.data.name || 'N/A'}`);
          return { valid: true, type: 'page', id: response.data.id, name: response.data.name };
        }
      } catch (error1) {
        // Si falla con /me, intentar con /{page-id} directamente
        console.log('   ⚠️ Verificación con /me falló, intentando método alternativo...');
      }
      
      // Método 2: Intentar obtener información de la página directamente
      // Si el token es un Page Access Token, debería funcionar
      try {
        // Obtener las páginas asociadas al token
        const pagesResponse = await axios.get('https://graph.facebook.com/v18.0/me/accounts', {
          params: {
            access_token: accessToken,
            fields: 'id,name,instagram_business_account'
          },
          timeout: 10000
        });
        
        if (pagesResponse.data && pagesResponse.data.data && pagesResponse.data.data.length > 0) {
          const page = pagesResponse.data.data[0];
          console.log('   ✅ Token verificado correctamente (Page Access Token)');
          console.log(`   📋 Página ID: ${page.id}`);
          console.log(`   📋 Nombre: ${page.name || 'N/A'}`);
          if (page.instagram_business_account) {
            console.log(`   📋 Instagram Business Account ID: ${page.instagram_business_account.id}`);
          }
          return { valid: true, type: 'page', id: page.id, name: page.name };
        }
      } catch (error2) {
        // Si ambos métodos fallan, el token puede ser inválido
        console.warn('   ⚠️ No se pudo verificar el token con ningún método');
      }
      
      // Si llegamos aquí, no pudimos verificar el token
      return { valid: false, type: 'unknown' };
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      const errorCode = error.response?.data?.error?.code;
      const errorStatus = error.response?.status;
      
      console.warn('   ⚠️ ADVERTENCIA: Error verificando token');
      console.warn(`   💡 Error: ${errorMessage}`);
      
      if (errorStatus === 401 || errorCode === 190) {
        console.warn('   ⚠️ El token puede estar expirado o ser inválido');
        console.warn('   💡 El sistema intentará usarlo de todas formas, pero puede fallar');
        
        if (throwError) {
          throw new Error(`Token inválido o expirado: ${errorMessage}`);
        }
      }
      
      // Retornar que no es válido, pero no bloquear el proceso
      return { valid: false, type: 'unknown', error: errorMessage };
    }
  }

  // Responder a comentario usando Instagram Graph API
  async replyToComment(commentId, message) {
    try {
      console.log('\n   🔑 [REPLY-TO-COMMENT] Obteniendo token de acceso...');
      
      // Obtener token desde Settings o .env
      const accessToken = await this.getAccessToken();
      
      if (!accessToken) {
        console.error('❌ INSTAGRAM_PAGE_ACCESS_TOKEN no está configurado o es inválido');
        console.error('   💡 Configura el token en:');
        console.error('      1. Settings → Instagram API → Page Access Token');
        console.error('      2. O en el archivo .env como INSTAGRAM_PAGE_ACCESS_TOKEN');
        console.error('   💡 Verifica que el token:');
        console.error('      - No tenga espacios extra');
        console.error('      - No tenga saltos de línea');
        console.error('      - Sea un token válido de Instagram');
        throw new Error('Instagram Page Access Token no configurado o inválido. Por favor, verifica el token en Settings → Instagram API.');
      }

      // Verificar el token antes de usarlo (OPCIONAL - solo warning, no bloquea)
      console.log('   🔍 Verificando token (verificación opcional)...');
      try {
        const tokenVerification = await this.verifyToken(accessToken, false);
        if (!tokenVerification.valid) {
          console.warn('   ⚠️ ADVERTENCIA: El token no pudo ser verificado');
          console.warn('   💡 El sistema intentará usarlo de todas formas');
          console.warn('   💡 Si falla, genera un nuevo token en Facebook Developers');
          console.warn('   💡 Enlace: https://developers.facebook.com/tools/explorer/');
        }
      } catch (verifyError) {
        // Si la verificación falla, solo advertir pero continuar
        console.warn('   ⚠️ ADVERTENCIA: Error verificando token, pero continuando...');
        console.warn(`   💡 Error: ${verifyError.message}`);
        console.warn('   💡 El sistema intentará usar el token de todas formas');
      }

      if (!commentId || commentId === 'unknown' || commentId === null) {
        console.error('❌ Comment ID no válido:', commentId);
        throw new Error('Comment ID es requerido y debe ser válido');
      }

      // Validar que el commentId sea numérico (Instagram usa IDs numéricos)
      if (!/^\d+$/.test(commentId)) {
        console.error('❌ Comment ID no es numérico:', commentId);
        console.error('   💡 Instagram requiere IDs numéricos para comentarios');
        throw new Error(`Comment ID inválido: "${commentId}". Debe ser un número.`);
      }

      // Instagram Graph API endpoint para responder a comentarios
      // POST https://graph.instagram.com/{comment-id}/replies
      const url = `${INSTAGRAM_API_URL}/${commentId}/replies`;
      
      console.log('   💬 Enviando respuesta automática a comentario:');
      console.log(`      Comment ID: ${commentId}`);
      console.log(`      Mensaje: "${message.substring(0, 50)}..."`);
      console.log(`      URL: ${url}`);
      console.log(`      Token length: ${accessToken.length} caracteres`);

      // Instagram Graph API - formato correcto para responder a comentarios
      // Endpoint: POST https://graph.instagram.com/{comment-id}/replies
      // Parámetros: message (texto) y access_token (en query string)
      // IMPORTANTE: Instagram NO acepta JSON para este endpoint, solo form-data o query string
      
      let response;
      let lastError = null;
      
      // Método 1: Intentar con form-data en el body (método más confiable según documentación)
      try {
        console.log('   📤 Método 1: Intentando con form-data en body...');
        const formData = new URLSearchParams();
        formData.append('message', message);
        formData.append('access_token', accessToken);
        
        response = await axios.post(url, formData.toString(), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0'
          },
          timeout: 30000
        });
        
        console.log('   ✅ Método 1 exitoso (form-data)');
      } catch (error1) {
        lastError = error1;
        console.log('   ⚠️ Método 1 falló, intentando método 2...');
        console.log(`      Error: ${error1.response?.status} - ${error1.response?.data?.error?.message || error1.message}`);
        
        // Método 2: Intentar con query string
        try {
          console.log('   📤 Método 2: Intentando con query string...');
          const params = new URLSearchParams();
          params.append('message', message);
          params.append('access_token', accessToken);
          
          const urlWithParams = `${url}?${params.toString()}`;
          
          response = await axios.post(urlWithParams, null, {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'User-Agent': 'Mozilla/5.0'
            },
            timeout: 30000
          });
          
          console.log('   ✅ Método 2 exitoso (query string)');
        } catch (error2) {
          lastError = error2;
          console.error('   ❌ Todos los métodos fallaron');
          throw error2;
        }
      }

      if (!response || !response.data) {
        throw new Error('No se recibió respuesta de Instagram API');
      }

      console.log(`\n   ✅ RESPUESTA AUTOMÁTICA ENVIADA EXITOSAMENTE A INSTAGRAM!`);
      console.log(`   Comment ID: ${commentId}`);
      console.log(`   Reply ID: ${response.data.id || 'N/A'}`);
      console.log(`   Mensaje: "${message.substring(0, 50)}..."`);
      console.log(`   Response:`, JSON.stringify(response.data, null, 2));

      return {
        success: true,
        commentId,
        replyId: response.data.id,
        message,
        timestamp: new Date(),
        instagramResponse: response.data
      };
    } catch (error) {
      console.error('\n   ❌ ERROR CRÍTICO EN REPLY-TO-COMMENT:');
      console.error(`   Mensaje: ${error.message}`);
      
      // Si es un error de la API, loguear más detalles
      if (error.response) {
        console.error(`   Status: ${error.response.status}`);
        console.error(`   Status Text: ${error.response.statusText}`);
        console.error(`   Data:`, JSON.stringify(error.response.data, null, 2));
        
        const errorData = error.response.data?.error || {};
        const errorCode = errorData.code;
        const errorMessage = errorData.message;
        const errorType = errorData.type;
        
        console.error(`   Error Code: ${errorCode}`);
        console.error(`   Error Type: ${errorType}`);
        console.error(`   Error Message: ${errorMessage}`);
        
        // Mensajes de error más claros según el código
        if (error.response.status === 400) {
          if (errorCode === 190) {
            console.error('\n   🔴 ERROR 190: Cannot parse access token');
            console.error('   💡 ESTO SIGNIFICA QUE EL TOKEN NO ES VÁLIDO O ESTÁ EXPIRADO');
            console.error('');
            console.error('   📋 SOLUCIÓN PASO A PASO:');
            console.error('');
            console.error('   1. Ve a Facebook Developers: https://developers.facebook.com/apps/');
            console.error('   2. Selecciona tu app de Instagram');
            console.error('   3. Ve a Tools → Graph API Explorer');
            console.error('   4. En "User or Page", selecciona tu PÁGINA (no tu usuario personal)');
            console.error('   5. Haz clic en "Generate Access Token"');
            console.error('   6. Asegúrate de tener estos permisos seleccionados:');
            console.error('      ✅ instagram_basic');
            console.error('      ✅ pages_show_list');
            console.error('      ✅ pages_read_engagement');
            console.error('      ✅ pages_manage_posts');
            console.error('      ✅ instagram_manage_comments (OBLIGATORIO para responder)');
            console.error('   7. Copia el token COMPLETO (debe tener ~200 caracteres)');
            console.error('   8. Pégalo en Settings → Instagram API → Page Access Token');
            console.error('   9. Asegúrate de que NO tenga espacios extra al principio o al final');
            console.error('   10. Guarda y reinicia el servidor');
            console.error('');
            console.error('   ⚠️ IMPORTANTE:');
            console.error('   - El token debe ser un PAGE ACCESS TOKEN (no un User Access Token)');
            console.error('   - El token puede expirar después de ~60 días');
            console.error('   - Si cambias la contraseña de Facebook, el token se invalida');
            console.error('   - Si el token está expirado, genera uno nuevo');
            console.error('');
            console.error('   🔗 Enlace directo: https://developers.facebook.com/tools/explorer/');
          } else if (errorMessage && errorMessage.includes('Invalid OAuth access token')) {
            console.error('\n   🔴 TOKEN INVÁLIDO O EXPIRADO');
            console.error('   💡 El token que estás usando no es válido');
            console.error('   💡 Por favor, genera un nuevo Page Access Token en Facebook Developers');
          } else {
            console.error('   💡 El request está mal formateado o falta información');
            console.error('   💡 Verifica que el Comment ID sea válido y numérico');
          }
        } else if (error.response.status === 401) {
          console.error('   💡 El token de acceso es inválido o ha expirado');
          console.error('   💡 Genera un nuevo token en Facebook Developers');
        } else if (error.response.status === 403) {
          console.error('   💡 No tienes permisos para responder a este comentario');
          console.error('   💡 Verifica que el token tenga los permisos necesarios:');
          console.error('      - instagram_manage_comments (OBLIGATORIO)');
          console.error('      - pages_manage_posts (OBLIGATORIO)');
        } else if (error.response.status === 404) {
          console.error('   💡 El comentario no existe o el Comment ID es incorrecto');
        }
      } else {
        console.error(`   Stack:`, error.stack);
      }
      
      throw error;
    }
  }

  // Obtener información del usuario
  async getUserInfo(username) {
    try {
      // Simulado - en producción usaría la API real
      return {
        success: true,
        username,
        profilePicture: null,
        followers: 0,
        following: 0
      };
    } catch (error) {
      console.error('Error getting user info:', error);
      throw error;
    }
  }
}

export default new InstagramService();

