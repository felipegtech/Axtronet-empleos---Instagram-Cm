# ===========================================
# Axtronet Instagram CM - Startup Script (Windows PowerShell)
# ===========================================

# Configuración de errores
$ErrorActionPreference = "Continue"  # Cambiar a Continue para manejar errores manualmente
# Set-StrictMode -Version Latest  # Comentado para evitar errores con variables no inicializadas

# Colores para output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Header($Message) {
    Write-Output ""
    Write-ColorOutput Cyan "==========================================="
    Write-ColorOutput Cyan $Message
    Write-ColorOutput Cyan "==========================================="
    Write-Output ""
}

function Write-Success($Message) {
    Write-ColorOutput Green "✅ $Message"
}

function Write-Error-Custom($Message) {
    Write-ColorOutput Red "❌ $Message"
}

function Write-Warning-Custom($Message) {
    Write-ColorOutput Yellow "⚠️  $Message"
}

function Write-Info($Message) {
    Write-ColorOutput Blue $Message
}

# Verificar si un comando existe
function Test-Command($Command) {
    try {
        if (Get-Command $Command -ErrorAction SilentlyContinue) {
            return $true
        }
        return $false
    } catch {
        return $false
    }
}

# Verificar si Docker está instalado
function Test-DockerInstalled {
    if (Test-Command "docker") {
        try {
            $version = docker --version 2>&1
            if ($LASTEXITCODE -eq 0) {
                return $true
            }
        } catch {
            return $false
        }
    }
    return $false
}

# Verificar si Docker Compose está disponible
function Test-DockerComposeAvailable {
    if (Test-Command "docker") {
        try {
            $result = docker compose version 2>&1
            if ($LASTEXITCODE -eq 0) {
                return $true
            }
            # Intentar con docker-compose (v1)
            $result = docker-compose version 2>&1
            if ($LASTEXITCODE -eq 0) {
                return $true
            }
        } catch {
            return $false
        }
    }
    return $false
}

# Verificar si Docker Desktop está corriendo
function Test-DockerDesktopRunning {
    try {
        $process = Get-Process "Docker Desktop" -ErrorAction SilentlyContinue
        if ($process) {
            return $true
        }
        # También verificar si el daemon de Docker está corriendo
        docker info 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            return $true
        }
        return $false
    } catch {
        return $false
    }
}

# Instalar Docker Desktop
function Install-DockerDesktop {
    Write-Header "Instalación de Docker Desktop"
    
    Write-Warning-Custom "Docker Desktop no está instalado."
    Write-Output ""
    Write-Output "Docker Desktop es necesario para ejecutar este proyecto."
    Write-Output ""
    Write-Output "Opciones:"
    Write-Output "1. Descargar e instalar Docker Desktop automáticamente (Recomendado)"
    Write-Output "2. Abrir la página de descarga de Docker Desktop"
    Write-Output "3. Cancelar y salir"
    Write-Output ""
    
    # Verificar si estamos en modo interactivo
    try {
        $choice = Read-Host "Selecciona una opción (1-3) [Presiona Enter para opción 1]"
        if ([string]::IsNullOrWhiteSpace($choice)) {
            $choice = "1"
        }
    } catch {
        # Si no hay entrada disponible (modo no interactivo), usar opción 1
        Write-Info "Ejecutando en modo no interactivo, usando opción 1 por defecto..."
        $choice = "1"
    }
    
    switch ($choice) {
        "1" {
            Write-Info "Descargando Docker Desktop..."
            
            # Detectar arquitectura del sistema
            $arch = $env:PROCESSOR_ARCHITECTURE
            if ($env:PROCESSOR_ARCHITEW6432) {
                $arch = $env:PROCESSOR_ARCHITEW6432
            }
            
            # URL de descarga (usar la más reciente estable)
            $downloadUrl = "https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe"
            if ($arch -eq "ARM64") {
                $downloadUrl = "https://desktop.docker.com/win/main/arm64/Docker%20Desktop%20Installer.exe"
            }
            
            $installerPath = Join-Path $env:TEMP "DockerDesktopInstaller.exe"
            
            try {
                # Verificar si el instalador ya existe
                if (Test-Path $installerPath) {
                    Write-Info "Instalador ya existe en: $installerPath"
                    try {
                        $useExisting = Read-Host "¿Usar instalador existente? (S/N) [S]"
                        if ([string]::IsNullOrWhiteSpace($useExisting) -or $useExisting -eq "S" -or $useExisting -eq "s") {
                            Write-Info "Usando instalador existente..."
                        } else {
                            Write-Info "Descargando nuevo instalador..."
                            Remove-Item $installerPath -Force -ErrorAction SilentlyContinue
                            Invoke-WebRequest -Uri $downloadUrl -OutFile $installerPath -UseBasicParsing
                        }
                    } catch {
                        # Si no hay entrada disponible, usar el instalador existente
                        Write-Info "Usando instalador existente (modo no interactivo)..."
                    }
                } else {
                    # Descargar Docker Desktop
                    Write-Info "Descargando Docker Desktop desde $downloadUrl..."
                    Write-Info "Esto puede tardar varios minutos (el archivo es grande, ~500MB)..."
                    Write-Info "Por favor, espera..."
                    try {
                        Invoke-WebRequest -Uri $downloadUrl -OutFile $installerPath -UseBasicParsing
                    } catch {
                        Write-Error-Custom "Error descargando Docker Desktop: $_"
                        Write-Info "Por favor, descarga Docker Desktop manualmente desde:"
                        Write-Info "https://www.docker.com/products/docker-desktop/"
                        Write-Info "Y ejecuta el instalador manualmente"
                        exit 1
                    }
                }
                
                Write-Success "Docker Desktop descargado exitosamente"
                Write-Output ""
                Write-Warning-Custom "Ejecutando instalador..."
                Write-Warning-Custom "Por favor, sigue las instrucciones del instalador."
                Write-Warning-Custom "IMPORTANTE: Después de instalar, REINICIA tu computadora y luego ejecuta este script de nuevo."
                Write-Output ""
                
                # Ejecutar instalador
                Write-Info "Iniciando instalador de Docker Desktop..."
                Start-Process -FilePath $installerPath -Wait
                
                Write-Output ""
                Write-Success "Docker Desktop instalado exitosamente"
                Write-Output ""
                Write-Warning-Custom "IMPORTANTE:"
                Write-Warning-Custom "1. REINICIA tu computadora"
                Write-Warning-Custom "2. Inicia Docker Desktop"
                Write-Warning-Custom "3. Ejecuta este script de nuevo"
                Write-Output ""
                Write-Info "Presiona cualquier tecla para salir..."
                try {
                    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
                } catch {
                    # Si no hay teclado disponible, esperar unos segundos
                    Start-Sleep -Seconds 5
                }
                exit 0
            } catch {
                Write-Error-Custom "Error descargando Docker Desktop: $_"
                Write-Output ""
                Write-Info "Por favor, descarga Docker Desktop manualmente desde:"
                Write-Info "https://www.docker.com/products/docker-desktop/"
                Write-Output ""
                Write-Info "Presiona cualquier tecla para salir..."
                $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
                exit 1
            }
        }
        "2" {
            Write-Info "Abriendo página de descarga de Docker Desktop..."
            Start-Process "https://www.docker.com/products/docker-desktop/"
            Write-Output ""
            Write-Warning-Custom "Por favor, descarga e instala Docker Desktop manualmente."
            Write-Warning-Custom "Después de instalar, REINICIA tu computadora y ejecuta este script de nuevo."
            Write-Output ""
            Write-Info "Presiona cualquier tecla para salir..."
            $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
            exit 0
        }
        "3" {
            Write-Info "Cancelando instalación..."
            exit 0
        }
        default {
            Write-Error-Custom "Opción inválida"
            exit 1
        }
    }
}

# Iniciar Docker Desktop
function Start-DockerDesktop {
    Write-Header "Iniciando Docker Desktop"
    
    Write-Info "Docker Desktop no está corriendo."
    Write-Output ""
    Write-Output "Opciones:"
    Write-Output "1. Iniciar Docker Desktop automáticamente (Recomendado)"
    Write-Output "2. Cancelar y salir"
    Write-Output ""
    
    # Verificar si estamos en modo interactivo
    try {
        $choice = Read-Host "Selecciona una opción (1-2) [Presiona Enter para opción 1]"
        if ([string]::IsNullOrWhiteSpace($choice)) {
            $choice = "1"
        }
    } catch {
        # Si no hay entrada disponible (modo no interactivo), usar opción 1
        Write-Info "Ejecutando en modo no interactivo, usando opción 1 por defecto..."
        $choice = "1"
    }
    
    switch ($choice) {
        "1" {
            Write-Info "Iniciando Docker Desktop..."
            try {
                # Intentar múltiples rutas posibles para Docker Desktop
                $dockerDesktopPaths = @(
                    "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe",
                    "${env:ProgramFiles(x86)}\Docker\Docker\Docker Desktop.exe",
                    "$env:LOCALAPPDATA\Docker\Docker Desktop.exe",
                    "$env:ProgramFiles\Docker Desktop\Docker Desktop.exe"
                )
                
                $dockerDesktopPath = $null
                foreach ($path in $dockerDesktopPaths) {
                    if (Test-Path $path) {
                        $dockerDesktopPath = $path
                        break
                    }
                }
                
                if ($dockerDesktopPath) {
                    Write-Info "Ejecutando Docker Desktop desde: $dockerDesktopPath"
                    Start-Process -FilePath $dockerDesktopPath -WindowStyle Hidden
                    Write-Success "Docker Desktop iniciándose..."
                    Write-Output ""
                    Write-Warning-Custom "Esperando a que Docker Desktop esté listo..."
                    Write-Info "Esto puede tardar 1-2 minutos..."
                    Write-Output ""
                    
                    # Esperar a que Docker esté disponible (hasta 3 minutos)
                    $timeout = 180
                    $elapsed = 0
                    $checkInterval = 5
                    
                    while ($elapsed -lt $timeout) {
                        Write-Output "." -NoNewline
                        Start-Sleep -Seconds $checkInterval
                        $elapsed += $checkInterval
                        
                        if (Test-DockerDesktopRunning) {
                            Write-Output ""
                            Write-Success "Docker Desktop está corriendo y listo"
                            # Esperar un poco más para que esté completamente listo
                            Start-Sleep -Seconds 5
                            return $true
                        }
                    }
                    Write-Output ""
                    Write-Warning-Custom "Docker Desktop tardó más de lo esperado"
                    Write-Info "Por favor, verifica que Docker Desktop esté corriendo manualmente"
                    Write-Info "Puedes verificar el estado en la bandeja del sistema (systray)"
                    return $false
                } else {
                    Write-Error-Custom "No se encontró Docker Desktop en las rutas esperadas"
                    Write-Info "Rutas verificadas:"
                    foreach ($path in $dockerDesktopPaths) {
                        Write-Info "  - $path"
                    }
                    Write-Output ""
                    Write-Info "Por favor, inicia Docker Desktop manualmente desde el menú de inicio"
                    return $false
                }
            } catch {
                Write-Error-Custom "Error iniciando Docker Desktop: $_"
                Write-Info "Por favor, inicia Docker Desktop manualmente"
                return $false
            }
        }
        "2" {
            Write-Info "Cancelando..."
            Write-Output ""
            Write-Warning-Custom "Por favor, inicia Docker Desktop manualmente y vuelve a ejecutar este script"
            exit 0
        }
        default {
            Write-Error-Custom "Opción inválida"
            exit 1
        }
    }
}

# Función principal
function Main {
    Write-Header "Axtronet Instagram CM - Startup Script (Windows)"
    
    # Verificar Docker
    Write-Header "Verificando Prerequisitos"
    
    if (-not (Test-DockerInstalled)) {
        Write-Error-Custom "Docker no está instalado"
        Install-DockerDesktop
        exit 0
    } else {
        $dockerVersion = docker --version
        Write-Success "Docker está instalado: $dockerVersion"
    }
    
    # Verificar Docker Compose
    if (-not (Test-DockerComposeAvailable)) {
        Write-Error-Custom "Docker Compose no está disponible"
        Write-Info "Docker Compose debería venir con Docker Desktop"
        Write-Info "Por favor, verifica tu instalación de Docker Desktop"
        exit 1
    } else {
        try {
            $composeVersion = docker compose version 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Docker Compose está disponible: $composeVersion"
            } else {
                $composeVersion = docker-compose version 2>&1
                Write-Success "Docker Compose está disponible: $composeVersion"
            }
        } catch {
            Write-Warning-Custom "No se pudo verificar la versión de Docker Compose"
        }
    }
    
    # Verificar si Docker Desktop está corriendo
    if (-not (Test-DockerDesktopRunning)) {
        Write-Warning-Custom "Docker Desktop no está corriendo"
        if (-not (Start-DockerDesktop)) {
            Write-Error-Custom "No se pudo iniciar Docker Desktop"
            Write-Info "Por favor, inicia Docker Desktop manualmente y vuelve a ejecutar este script"
            exit 1
        }
    } else {
        Write-Success "Docker Desktop está corriendo"
    }
    
    # Verificar archivo .env
    Write-Header "Verificando Configuración"
    
    if (-not (Test-Path ".env")) {
        Write-Warning-Custom "Archivo .env no encontrado"
        if (Test-Path ".env.example") {
            Write-Info "Creando archivo .env desde .env.example..."
            Copy-Item ".env.example" ".env"
            Write-Success "Archivo .env creado desde .env.example"
            Write-Warning-Custom "Por favor, edita .env y configura las variables necesarias"
        } else {
            Write-Error-Custom "No se encontró .env.example. Por favor, crea un archivo .env manualmente."
            exit 1
        }
    } else {
        Write-Success "Archivo .env encontrado"
    }
    
    # Detener contenedores existentes
    Write-Header "Deteniendo Contenedores Existentes"
    
    try {
        docker compose down 2>&1 | Out-Null
        Write-Success "Contenedores detenidos (si existían)"
    } catch {
        Write-Warning-Custom "No se pudieron detener contenedores existentes (puede ser normal si no había contenedores)"
    }
    
    # Levantar servicios
    Write-Header "Levantando Servicios con Docker Compose"
    Write-Info "Esto puede tardar unos minutos la primera vez..."
    Write-Output ""
    
    try {
        docker compose up -d --build
        if ($LASTEXITCODE -ne 0) {
            Write-Error-Custom "Error levantando servicios con Docker Compose"
            exit 1
        }
        Write-Success "Servicios iniciados"
    } catch {
        Write-Error-Custom "Error levantando servicios: $_"
        exit 1
    }
    
    # Esperar a que los servicios estén listos
    Write-Header "Esperando a que los Servicios Estén Listos"
    Write-Info "Esperando a que los servicios estén completamente iniciados..."
    
    # Esperar a que MongoDB esté healthy
    Write-Output "   Esperando MongoDB..." -NoNewline
    $timeout = 60
    $elapsed = 0
    $mongoReady = $false
    
    while ($elapsed -lt $timeout -and -not $mongoReady) {
        try {
            $mongoStatus = docker compose ps mongo 2>&1
            if ($mongoStatus -match "healthy") {
                Write-Success " ✅"
                $mongoReady = $true
                break
            }
        } catch {
            # Ignorar errores
        }
        Write-Output "." -NoNewline
        Start-Sleep -Seconds 2
        $elapsed += 2
    }
    
    if (-not $mongoReady) {
        Write-Output ""
        Write-Warning-Custom "MongoDB tardó más de lo esperado"
    }
    
    # Obtener puerto del backend
    $backendPort = 5000
    if (Test-Path ".env") {
        $envContent = Get-Content ".env"
        foreach ($line in $envContent) {
            if ($line -match "^PORT=(.+)$") {
                $backendPort = $matches[1].Trim('"').Trim("'").Trim()
                break
            }
        }
    }
    
    # Esperar a que el backend esté listo
    Write-Output "   Esperando Backend..." -NoNewline
    $timeout = 60
    $elapsed = 0
    $backendReady = $false
    
    while ($elapsed -lt $timeout -and -not $backendReady) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:$backendPort/health" -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                Write-Success " ✅"
                $backendReady = $true
                break
            }
        } catch {
            # Ignorar errores
        }
        Write-Output "." -NoNewline
        Start-Sleep -Seconds 2
        $elapsed += 2
    }
    
    if (-not $backendReady) {
        Write-Output ""
        Write-Warning-Custom "Backend tardó más de lo esperado"
    }
    
    # Obtener puerto del frontend
    $frontendPort = 5173
    if (Test-Path ".env") {
        $envContent = Get-Content ".env"
        foreach ($line in $envContent) {
            if ($line -match "^FRONTEND_PORT=(.+)$") {
                $frontendPort = $matches[1].Trim('"').Trim("'").Trim()
                break
            }
        }
    }
    
    # Esperar a que el frontend esté listo
    Write-Output "   Esperando Frontend..." -NoNewline
    $timeout = 30
    $elapsed = 0
    $frontendReady = $false
    
    while ($elapsed -lt $timeout -and -not $frontendReady) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:$frontendPort" -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                Write-Success " ✅"
                $frontendReady = $true
                break
            }
        } catch {
            # Ignorar errores
        }
        Write-Output "." -NoNewline
        Start-Sleep -Seconds 2
        $elapsed += 2
    }
    
    if (-not $frontendReady) {
        Write-Output ""
        Write-Warning-Custom "Frontend tardó más de lo esperado"
    }
    
    # Verificar estado de los servicios
    Write-Header "Estado de los Servicios"
    
    Write-Output ""
    Write-Output "┌─────────────────┬─────────────────────────────────────────────────────┬──────────────────┐"
    Write-Output "│ Servicio        │ URL                                                    │ Estado           │"
    Write-Output "├─────────────────┼─────────────────────────────────────────────────────┼──────────────────┤"
    
    # MongoDB
    try {
        $mongoStatus = docker compose ps mongo 2>&1
        if ($mongoStatus -match "Up" -or $mongoStatus -match "healthy") {
            Write-Output "│ MongoDB         │ mongodb://localhost:27017                                        │ ✅ Activo        │"
        } else {
            Write-Output "│ MongoDB         │ mongodb://localhost:27017                                        │ ❌ Inactivo      │"
        }
    } catch {
        Write-Output "│ MongoDB         │ mongodb://localhost:27017                                        │ ❌ Inactivo      │"
    }
    
    # Backend
    try {
        $backendStatus = docker compose ps backend 2>&1
        if ($backendStatus -match "Up") {
            Write-Output "│ Backend API     │ http://localhost:$backendPort" -NoNewline
            Write-Output (" " * (55 - ("http://localhost:$backendPort").Length)) -NoNewline
            Write-Output "│ ✅ Activo        │"
        } else {
            Write-Output "│ Backend API     │ http://localhost:$backendPort" -NoNewline
            Write-Output (" " * (55 - ("http://localhost:$backendPort").Length)) -NoNewline
            Write-Output "│ ❌ Inactivo      │"
        }
    } catch {
        Write-Output "│ Backend API     │ http://localhost:$backendPort" -NoNewline
        Write-Output (" " * (55 - ("http://localhost:$backendPort").Length)) -NoNewline
        Write-Output "│ ❌ Inactivo      │"
    }
    
    # Frontend
    try {
        $frontendStatus = docker compose ps frontend 2>&1
        if ($frontendStatus -match "Up") {
            Write-Output "│ Frontend        │ http://localhost:$frontendPort" -NoNewline
            Write-Output (" " * (55 - ("http://localhost:$frontendPort").Length)) -NoNewline
            Write-Output "│ ✅ Activo        │"
        } else {
            Write-Output "│ Frontend        │ http://localhost:$frontendPort" -NoNewline
            Write-Output (" " * (55 - ("http://localhost:$frontendPort").Length)) -NoNewline
            Write-Output "│ ❌ Inactivo      │"
        }
    } catch {
        Write-Output "│ Frontend        │ http://localhost:$frontendPort" -NoNewline
        Write-Output (" " * (55 - ("http://localhost:$frontendPort").Length)) -NoNewline
        Write-Output "│ ❌ Inactivo      │"
    }
    
    # Health Check
    try {
        $healthResponse = Invoke-WebRequest -Uri "http://localhost:$backendPort/health" -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
        if ($healthResponse.StatusCode -eq 200) {
            Write-Output "│ Health Check    │ http://localhost:$backendPort/health" -NoNewline
            Write-Output (" " * (55 - ("http://localhost:$backendPort/health").Length)) -NoNewline
            Write-Output "│ ✅ Activo        │"
        } else {
            Write-Output "│ Health Check    │ http://localhost:$backendPort/health" -NoNewline
            Write-Output (" " * (55 - ("http://localhost:$backendPort/health").Length)) -NoNewline
            Write-Output "│ ⏳ Verificando  │"
        }
    } catch {
        Write-Output "│ Health Check    │ http://localhost:$backendPort/health" -NoNewline
        Write-Output (" " * (55 - ("http://localhost:$backendPort/health").Length)) -NoNewline
        Write-Output "│ ⏳ Verificando  │"
    }
    
    # Webhook
    try {
        $backendStatus = docker compose ps backend 2>&1
        if ($backendStatus -match "Up") {
            Write-Output "│ Webhook         │ http://localhost:$backendPort/webhook" -NoNewline
            Write-Output (" " * (55 - ("http://localhost:$backendPort/webhook").Length)) -NoNewline
            Write-Output "│ ✅ Activo        │"
        } else {
            Write-Output "│ Webhook         │ http://localhost:$backendPort/webhook" -NoNewline
            Write-Output (" " * (55 - ("http://localhost:$backendPort/webhook").Length)) -NoNewline
            Write-Output "│ ❌ Inactivo      │"
        }
    } catch {
        Write-Output "│ Webhook         │ http://localhost:$backendPort/webhook" -NoNewline
        Write-Output (" " * (55 - ("http://localhost:$backendPort/webhook").Length)) -NoNewline
        Write-Output "│ ❌ Inactivo      │"
    }
    
    Write-Output "└─────────────────┴─────────────────────────────────────────────────────┴──────────────────┘"
    Write-Output ""
    
    # Mostrar información de endpoints
    Write-Header "Endpoints Disponibles"
    
    Write-Output "Backend API:"
    Write-Output "  • Health Check:     http://localhost:$backendPort/health"
    Write-Output "  • Webhook:          http://localhost:$backendPort/webhook"
    Write-Output "  • API Base:         http://localhost:$backendPort/api"
    Write-Output "  • Stats:            http://localhost:$backendPort/api/stats"
    Write-Output "  • Job Offers:       http://localhost:$backendPort/api/job-offers"
    Write-Output "  • Candidates:       http://localhost:$backendPort/api/candidates"
    Write-Output "  • Surveys:          http://localhost:$backendPort/api/surveys"
    Write-Output ""
    Write-Output "Frontend:"
    Write-Output "  • Dashboard:        http://localhost:$frontendPort"
    Write-Output ""
    
    # Verificar conexión a MongoDB
    Write-Header "Verificación de Conexión"
    
    try {
        docker compose exec -T mongo mongosh --eval "db.adminCommand('ping')" --quiet 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "MongoDB está respondiendo correctamente"
        } else {
            Write-Warning-Custom "No se pudo verificar la conexión a MongoDB"
        }
    } catch {
        Write-Warning-Custom "No se pudo verificar la conexión a MongoDB"
    }
    
    # Verificar health check del backend
    try {
        $healthResponse = Invoke-WebRequest -Uri "http://localhost:$backendPort/health" -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
        if ($healthResponse.StatusCode -eq 200) {
            $healthData = $healthResponse.Content | ConvertFrom-Json
            Write-Success "Backend está respondiendo correctamente"
            if ($healthData.mongodb -eq "connected") {
                Write-Success "Backend conectado a MongoDB"
            } else {
                Write-Warning-Custom "Backend no está conectado a MongoDB aún"
            }
        } else {
            Write-Warning-Custom "Backend no está respondiendo aún (puede tardar unos segundos más)"
        }
    } catch {
        Write-Warning-Custom "Backend no está respondiendo aún (puede tardar unos segundos más)"
    }
    
    Write-Output ""
    
    # Mostrar comandos útiles
    Write-Header "Comandos Útiles"
    
    Write-Output "Ver logs:"
    Write-Output "  docker compose logs -f              # Todos los servicios"
    Write-Output "  docker compose logs -f backend      # Solo backend"
    Write-Output "  docker compose logs -f mongo        # Solo MongoDB"
    Write-Output ""
    Write-Output "Detener servicios:"
    Write-Output "  docker compose down                 # Detener y eliminar contenedores"
    Write-Output "  docker compose stop                 # Solo detener contenedores"
    Write-Output ""
    Write-Output "Reiniciar servicios:"
    Write-Output "  docker compose restart              # Reiniciar todos"
    Write-Output "  docker compose restart backend      # Reiniciar solo backend"
    Write-Output ""
    Write-Output "Ver estado:"
    Write-Output "  docker compose ps                   # Estado de los servicios"
    Write-Output ""
    
    # Mostrar próximos pasos
    Write-Header "Próximos Pasos"
    
    Write-Output "1. Abre el frontend en tu navegador:"
    Write-Output "   http://localhost:$frontendPort"
    Write-Output ""
    Write-Output "2. Configura el token de Instagram:"
    Write-Output "   a) Ve a Settings → Instagram API"
    Write-Output "   b) Ingresa tu INSTAGRAM_PAGE_ACCESS_TOKEN"
    Write-Output ""
    Write-Output "3. Configura ngrok para el webhook:"
    Write-Output "   ngrok http $backendPort"
    Write-Output ""
    Write-Output "4. Configura el webhook en Meta Developers:"
    Write-Output "   https://developers.facebook.com/apps/"
    Write-Output ""
    Write-Output "5. Prueba el sistema:"
    Write-Output "   • Crea una oferta laboral"
    Write-Output "   • Publica en Instagram"
    Write-Output "   • Haz un comentario de prueba"
    Write-Output "   • Verifica que se reciba el webhook"
    Write-Output ""
    
    Write-Success "Servicios iniciados correctamente!"
    Write-Info "Para ver los logs en tiempo real, ejecuta: docker compose logs -f"
    Write-Output ""
}

# Ejecutar función principal
try {
    Main
} catch {
    Write-Error-Custom "Error ejecutando script: $_"
    Write-Output ""
    Write-Output "Stack trace:"
    Write-Output $_.ScriptStackTrace
    exit 1
}

