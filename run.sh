#!/bin/bash

# ===========================================
# Axtronet Instagram CM - Startup Script
# ===========================================

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Función para imprimir con color
print_color() {
    color=$1
    message=$2
    echo -e "${color}${message}${NC}"
}

# Función para imprimir header
print_header() {
    echo ""
    echo -e "${CYAN}${BOLD}===========================================${NC}"
    echo -e "${CYAN}${BOLD}$1${NC}"
    echo -e "${CYAN}${BOLD}===========================================${NC}"
    echo ""
}

# Función para verificar si un comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Verificar Docker y Docker Compose
print_header "Verificando Prerequisitos"

if ! command_exists docker; then
    print_color "$RED" "❌ Docker no está instalado. Por favor, instala Docker primero."
    exit 1
fi

# Verificar Docker Compose (v2 como plugin o v1 como comando separado)
if ! docker compose version >/dev/null 2>&1 && ! command_exists docker-compose; then
    print_color "$RED" "❌ Docker Compose no está instalado. Por favor, instala Docker Compose primero."
    exit 1
fi

print_color "$GREEN" "✅ Docker está instalado"
print_color "$GREEN" "✅ Docker Compose está instalado"

# Verificar si existe .env
if [ ! -f .env ]; then
    print_color "$YELLOW" "⚠️  Archivo .env no encontrado"
    print_color "$YELLOW" "   Creando archivo .env desde .env.example (si existe)..."
    if [ -f .env.example ]; then
        cp .env.example .env
        print_color "$GREEN" "✅ Archivo .env creado desde .env.example"
        print_color "$YELLOW" "   ⚠️  Por favor, edita .env y configura las variables necesarias"
    else
        print_color "$RED" "❌ No se encontró .env.example. Por favor, crea un archivo .env manualmente."
        exit 1
    fi
else
    print_color "$GREEN" "✅ Archivo .env encontrado"
fi

# Detener contenedores existentes
print_header "Deteniendo Contenedores Existentes"
docker compose down 2>/dev/null || true

# Levantar servicios
print_header "Levantando Servicios con Docker Compose"
print_color "$BLUE" "🔄 Esto puede tardar unos minutos la primera vez..."
echo ""

docker compose up -d --build

# Esperar a que los servicios estén listos
print_header "Esperando a que los Servicios Estén Listos"
print_color "$BLUE" "⏳ Esperando a que los servicios estén completamente iniciados..."

# Esperar a que MongoDB esté healthy
echo -n "   Esperando MongoDB..."
timeout=60
elapsed=0
while [ $elapsed -lt $timeout ]; do
    if docker compose ps mongo | grep -q "healthy"; then
        print_color "$GREEN" " ✅"
        break
    fi
    echo -n "."
    sleep 2
    elapsed=$((elapsed + 2))
done

if [ $elapsed -ge $timeout ]; then
    print_color "$YELLOW" " ⚠️  MongoDB tardó más de lo esperado"
fi

# Obtener puerto del backend antes de esperar
BACKEND_PORT_TEMP=5000
if [ -f .env ]; then
    if grep -q "^PORT=" .env; then
        BACKEND_PORT_TEMP=$(grep "^PORT=" .env | cut -d'=' -f2 | tr -d '"' | tr -d "'" | xargs)
    fi
fi
BACKEND_PORT_TEMP=${BACKEND_PORT_TEMP:-5000}

# Esperar a que el backend esté listo
echo -n "   Esperando Backend..."
timeout=60
elapsed=0
while [ $elapsed -lt $timeout ]; do
    if curl -s http://localhost:${BACKEND_PORT_TEMP}/health >/dev/null 2>&1; then
        print_color "$GREEN" " ✅"
        break
    fi
    echo -n "."
    sleep 2
    elapsed=$((elapsed + 2))
done

if [ $elapsed -ge $timeout ]; then
    print_color "$YELLOW" " ⚠️  Backend tardó más de lo esperado"
fi

# Obtener puerto del frontend antes de esperar
FRONTEND_PORT_TEMP=5173
if [ -f .env ]; then
    if grep -q "^FRONTEND_PORT=" .env; then
        FRONTEND_PORT_TEMP=$(grep "^FRONTEND_PORT=" .env | cut -d'=' -f2 | tr -d '"' | tr -d "'" | xargs)
    fi
fi
FRONTEND_PORT_TEMP=${FRONTEND_PORT_TEMP:-5173}

# Esperar a que el frontend esté listo
echo -n "   Esperando Frontend..."
timeout=30
elapsed=0
while [ $elapsed -lt $timeout ]; do
    if curl -s http://localhost:${FRONTEND_PORT_TEMP} >/dev/null 2>&1 || curl -s http://localhost:80 >/dev/null 2>&1; then
        print_color "$GREEN" " ✅"
        break
    fi
    echo -n "."
    sleep 2
    elapsed=$((elapsed + 2))
done

if [ $elapsed -ge $timeout ]; then
    print_color "$YELLOW" " ⚠️  Frontend tardó más de lo esperado"
fi

# Obtener puertos desde .env o usar defaults
BACKEND_PORT=5000
FRONTEND_PORT=5173

# Leer puertos desde .env si existe
if [ -f .env ]; then
    if grep -q "^PORT=" .env; then
        BACKEND_PORT=$(grep "^PORT=" .env | cut -d'=' -f2 | tr -d '"' | tr -d "'" | xargs)
    fi
    if grep -q "^FRONTEND_PORT=" .env; then
        FRONTEND_PORT=$(grep "^FRONTEND_PORT=" .env | cut -d'=' -f2 | tr -d '"' | tr -d "'" | xargs)
    fi
fi

# Valores por defecto si están vacíos
BACKEND_PORT=${BACKEND_PORT:-5000}
FRONTEND_PORT=${FRONTEND_PORT:-5173}

# Verificar si los servicios están corriendo
print_header "Estado de los Servicios"

# Obtener información de los servicios
MONGO_STATUS=$(docker compose ps mongo 2>/dev/null | tail -n 1 | awk '{print $4}' || echo "unknown")
BACKEND_STATUS=$(docker compose ps backend 2>/dev/null | tail -n 1 | awk '{print $4}' || echo "unknown")
FRONTEND_STATUS=$(docker compose ps frontend 2>/dev/null | tail -n 1 | awk '{print $4}' || echo "unknown")

# Normalizar estados
if [ "$MONGO_STATUS" = "Up" ] || [ "$MONGO_STATUS" = "healthy" ] || docker compose ps mongo 2>/dev/null | grep -q "Up"; then
    MONGO_ACTIVE=true
else
    MONGO_ACTIVE=false
fi

if [ "$BACKEND_STATUS" = "Up" ] || docker compose ps backend 2>/dev/null | grep -q "Up"; then
    BACKEND_ACTIVE=true
else
    BACKEND_ACTIVE=false
fi

if [ "$FRONTEND_STATUS" = "Up" ] || docker compose ps frontend 2>/dev/null | grep -q "Up"; then
    FRONTEND_ACTIVE=true
else
    FRONTEND_ACTIVE=false
fi

# Verificar health check
HEALTH_CHECK_OK=false
if curl -s http://localhost:${BACKEND_PORT}/health >/dev/null 2>&1; then
    HEALTH_CHECK_OK=true
fi

# Mostrar tabla de servicios
echo ""
echo -e "${BOLD}┌─────────────────┬─────────────────────────────────────────────────────┬──────────────────┐${NC}"
echo -e "${BOLD}│${NC} ${CYAN}Servicio${NC}        ${BOLD}│${NC} ${CYAN}URL${NC}                                                    ${BOLD}│${NC} ${CYAN}Estado${NC}          ${BOLD}│${NC}"
echo -e "${BOLD}├─────────────────┼─────────────────────────────────────────────────────┼──────────────────┤${NC}"

# MongoDB
if [ "$MONGO_ACTIVE" = true ]; then
    MONGO_DISPLAY="${GREEN}✅ Activo${NC}"
else
    MONGO_DISPLAY="${RED}❌ Inactivo${NC}"
fi
echo -e "${BOLD}│${NC} MongoDB         ${BOLD}│${NC} mongodb://localhost:27017                                        ${BOLD}│${NC} $MONGO_DISPLAY          ${BOLD}│${NC}"

# Backend
BACKEND_URL="http://localhost:${BACKEND_PORT}"
BACKEND_URL_PADDED=$(printf "%-55s" "$BACKEND_URL")
if [ "$BACKEND_ACTIVE" = true ]; then
    BACKEND_DISPLAY="${GREEN}✅ Activo${NC}"
else
    BACKEND_DISPLAY="${RED}❌ Inactivo${NC}"
fi
echo -e "${BOLD}│${NC} Backend API     ${BOLD}│${NC} ${BACKEND_URL_PADDED}${BOLD}│${NC} $BACKEND_DISPLAY          ${BOLD}│${NC}"

# Frontend
FRONTEND_URL="http://localhost:${FRONTEND_PORT}"
FRONTEND_URL_PADDED=$(printf "%-55s" "$FRONTEND_URL")
if [ "$FRONTEND_ACTIVE" = true ]; then
    FRONTEND_DISPLAY="${GREEN}✅ Activo${NC}"
else
    FRONTEND_DISPLAY="${RED}❌ Inactivo${NC}"
fi
echo -e "${BOLD}│${NC} Frontend        ${BOLD}│${NC} ${FRONTEND_URL_PADDED}${BOLD}│${NC} $FRONTEND_DISPLAY          ${BOLD}│${NC}"

# Health Check
HEALTH_URL="http://localhost:${BACKEND_PORT}/health"
HEALTH_URL_PADDED=$(printf "%-55s" "$HEALTH_URL")
if [ "$HEALTH_CHECK_OK" = true ]; then
    HEALTH_DISPLAY="${GREEN}✅ Activo${NC}"
else
    HEALTH_DISPLAY="${YELLOW}⏳ Verificando${NC}"
fi
echo -e "${BOLD}│${NC} Health Check    ${BOLD}│${NC} ${HEALTH_URL_PADDED}${BOLD}│${NC} $HEALTH_DISPLAY       ${BOLD}│${NC}"

# Webhook
WEBHOOK_URL="http://localhost:${BACKEND_PORT}/webhook"
WEBHOOK_URL_PADDED=$(printf "%-55s" "$WEBHOOK_URL")
if [ "$BACKEND_ACTIVE" = true ]; then
    WEBHOOK_DISPLAY="${GREEN}✅ Activo${NC}"
else
    WEBHOOK_DISPLAY="${RED}❌ Inactivo${NC}"
fi
echo -e "${BOLD}│${NC} Webhook         ${BOLD}│${NC} ${WEBHOOK_URL_PADDED}${BOLD}│${NC} $WEBHOOK_DISPLAY          ${BOLD}│${NC}"

echo -e "${BOLD}└─────────────────┴─────────────────────────────────────────────────────┴──────────────────┘${NC}"
echo ""

# Mostrar información de endpoints
print_header "Endpoints Disponibles"

echo -e "${BOLD}Backend API:${NC}"
echo -e "  ${GREEN}•${NC} Health Check:     http://localhost:${BACKEND_PORT}/health"
echo -e "  ${GREEN}•${NC} Webhook:          http://localhost:${BACKEND_PORT}/webhook"
echo -e "  ${GREEN}•${NC} API Base:         http://localhost:${BACKEND_PORT}/api"
echo -e "  ${GREEN}•${NC} Stats:            http://localhost:${BACKEND_PORT}/api/stats"
echo -e "  ${GREEN}•${NC} Job Offers:       http://localhost:${BACKEND_PORT}/api/job-offers"
echo -e "  ${GREEN}•${NC} Candidates:       http://localhost:${BACKEND_PORT}/api/candidates"
echo -e "  ${GREEN}•${NC} Surveys:          http://localhost:${BACKEND_PORT}/api/surveys"
echo ""
echo -e "${BOLD}Frontend:${NC}"
echo -e "  ${GREEN}•${NC} Dashboard:        http://localhost:${FRONTEND_PORT}"
echo ""

# Verificar ngrok
print_header "Configuración de Ngrok"

if command_exists ngrok; then
    print_color "$GREEN" "✅ Ngrok está instalado"
    echo ""
    echo -e "${BOLD}📋 Pasos para Configurar Ngrok:${NC}"
    echo ""
    echo -e "${YELLOW}1.${NC} En una nueva terminal, ejecuta:"
    echo -e "   ${CYAN}ngrok http ${BACKEND_PORT}${NC}"
    echo ""
    echo -e "${YELLOW}2.${NC} Ngrok te dará una URL HTTPS pública, por ejemplo:"
    echo -e "   ${GREEN}https://abc123.ngrok.io${NC}"
    echo ""
    echo -e "${YELLOW}3.${NC} Copia la URL HTTPS de ngrok"
    echo ""
    echo -e "${YELLOW}4.${NC} Configura el webhook en Meta Developers:"
    echo -e "   ${CYAN}a)${NC} Ve a https://developers.facebook.com/apps/"
    echo -e "   ${CYAN}b)${NC} Selecciona tu app de Instagram"
    echo -e "   ${CYAN}c)${NC} Ve a Instagram → Webhooks"
    echo -e "   ${CYAN}d)${NC} Agrega la URL del webhook: ${GREEN}https://abc123.ngrok.io/webhook${NC}"
    echo -e "   ${CYAN}e)${NC} Configura el VERIFY_TOKEN (debe coincidir con el de tu .env)"
    echo -e "   ${CYAN}f)${NC} Suscribe los eventos: ${GREEN}comments${NC}, ${GREEN}reactions${NC}, ${GREEN}messaging${NC}"
    echo ""
    echo -e "${YELLOW}5.${NC} Verifica el webhook haciendo clic en 'Verify and Save'"
    echo ""
    echo -e "${BOLD}⚠️  Importante:${NC}"
    echo -e "   • La URL de ngrok cambia cada vez que lo reinicias (plan gratuito)"
    echo -e "   • Para producción, usa un dominio permanente o ngrok con dominio fijo"
    echo -e "   • El VERIFY_TOKEN debe coincidir exactamente con el configurado en .env"
    echo ""
else
    print_color "$YELLOW" "⚠️  Ngrok no está instalado"
    echo ""
    echo -e "${BOLD}📋 Instalación de Ngrok:${NC}"
    echo ""
    echo -e "${YELLOW}Opción 1:${NC} Descargar desde https://ngrok.com/download"
    echo ""
    echo -e "${YELLOW}Opción 2:${NC} Instalar con package manager:"
    echo -e "   ${CYAN}•${NC} macOS: ${GREEN}brew install ngrok${NC}"
    echo -e "   ${CYAN}•${NC} Linux: Descargar y descomprimir"
    echo -e "   ${CYAN}•${NC} Windows: Descargar ejecutable"
    echo ""
    echo -e "${YELLOW}Opción 3:${NC} Usar npm: ${GREEN}npm install -g ngrok${NC}"
    echo ""
    echo -e "${BOLD}Después de instalar ngrok:${NC}"
    echo -e "   1. Ejecuta: ${CYAN}ngrok http ${BACKEND_PORT}${NC}"
    echo -e "   2. Configura el webhook en Meta Developers con la URL HTTPS de ngrok"
    echo ""
fi

# Mostrar comandos útiles
print_header "Comandos Útiles"

echo -e "${BOLD}Ver logs:${NC}"
echo -e "  ${CYAN}docker compose logs -f${NC}              # Todos los servicios"
echo -e "  ${CYAN}docker compose logs -f backend${NC}      # Solo backend"
echo -e "  ${CYAN}docker compose logs -f mongo${NC}        # Solo MongoDB"
echo ""
echo -e "${BOLD}Detener servicios:${NC}"
echo -e "  ${CYAN}docker compose down${NC}                 # Detener y eliminar contenedores"
echo -e "  ${CYAN}docker compose stop${NC}                 # Solo detener contenedores"
echo ""
echo -e "${BOLD}Reiniciar servicios:${NC}"
echo -e "  ${CYAN}docker compose restart${NC}              # Reiniciar todos"
echo -e "  ${CYAN}docker compose restart backend${NC}      # Reiniciar solo backend"
echo ""
echo -e "${BOLD}Ver estado:${NC}"
echo -e "  ${CYAN}docker compose ps${NC}                   # Estado de los servicios"
echo ""

# Verificar conexión a MongoDB
print_header "Verificación de Conexión"

if docker compose exec -T mongo mongosh --eval "db.adminCommand('ping')" --quiet >/dev/null 2>&1; then
    print_color "$GREEN" "✅ MongoDB está respondiendo correctamente"
else
    print_color "$YELLOW" "⚠️  No se pudo verificar la conexión a MongoDB"
fi

# Verificar health check del backend
if curl -s http://localhost:${BACKEND_PORT}/health | grep -q "ok"; then
    print_color "$GREEN" "✅ Backend está respondiendo correctamente"
    MONGO_STATUS=$(curl -s http://localhost:${BACKEND_PORT}/health | grep -o '"mongodb":"[^"]*"' | cut -d'"' -f4)
    if [ "$MONGO_STATUS" = "connected" ]; then
        print_color "$GREEN" "✅ Backend conectado a MongoDB"
    else
        print_color "$YELLOW" "⚠️  Backend no está conectado a MongoDB aún"
    fi
else
    print_color "$YELLOW" "⚠️  Backend no está respondiendo aún (puede tardar unos segundos más)"
fi

echo ""

# Mostrar siguiente paso
print_header "Próximos Pasos"

echo -e "${BOLD}1.${NC} Abre el frontend en tu navegador:"
echo -e "   ${CYAN}http://localhost:${FRONTEND_PORT}${NC}"
echo ""
echo -e "${BOLD}2.${NC} Configura el token de Instagram:"
echo -e "   ${CYAN}a)${NC} Ve a Settings → Instagram API"
echo -e "   ${CYAN}b)${NC} Ingresa tu INSTAGRAM_PAGE_ACCESS_TOKEN"
echo ""
echo -e "${BOLD}3.${NC} Configura ngrok para el webhook:"
echo -e "   ${CYAN}ngrok http ${BACKEND_PORT}${NC}"
echo ""
echo -e "${BOLD}4.${NC} Configura el webhook en Meta Developers:"
echo -e "   ${CYAN}https://developers.facebook.com/apps/${NC}"
echo ""
echo -e "${BOLD}5.${NC} Prueba el sistema:"
echo -e "   ${CYAN}•${NC} Crea una oferta laboral"
echo -e "   ${CYAN}•${NC} Publica en Instagram"
echo -e "   ${CYAN}•${NC} Haz un comentario de prueba"
echo -e "   ${CYAN}•${NC} Verifica que se reciba el webhook"
echo ""

print_color "$GREEN" "✅ Servicios iniciados correctamente!"
print_color "$BLUE" "📊 Para ver los logs en tiempo real, ejecuta: ${CYAN}docker compose logs -f${NC}"
echo ""

