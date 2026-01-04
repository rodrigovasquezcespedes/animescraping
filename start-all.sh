#!/bin/bash

# Script para iniciar Backend y Frontend simultáneamente

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # Sin color

# Directorio del proyecto
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      🚀 INICIANDO ANIMESCRAPING - FULL STACK 🚀      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Función para verificar si un puerto está en uso
check_port() {
    lsof -i :"$1" > /dev/null 2>&1
    return $?
}

# Verificar puertos
echo -e "${YELLOW}🔍 Verificando puertos...${NC}"
if check_port 5000; then
    echo -e "${RED}❌ Puerto 5000 (Backend) ya está en uso${NC}"
    echo -e "${YELLOW}   Detener con: lsof -ti:5000 | xargs kill -9${NC}"
    exit 1
fi

if check_port 5173; then
    echo -e "${RED}❌ Puerto 5173 (Frontend) ya está en uso${NC}"
    echo -e "${YELLOW}   Detener con: lsof -ti:5173 | xargs kill -9${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Puertos disponibles${NC}"
echo ""

# Iniciar Backend
echo -e "${GREEN}📡 Iniciando Backend (Puerto 5000)...${NC}"
cd "$PROJECT_DIR/backend"
PORT=5000 nohup node server.js > /tmp/animescraping-backend.log 2>&1 &
BACKEND_PID=$!
echo -e "   PID: ${BACKEND_PID}"
echo ""

# Esperar un momento para que el backend inicie
sleep 2

# Iniciar Frontend
echo -e "${GREEN}🎨 Iniciando Frontend (Puerto 5173)...${NC}"
cd "$PROJECT_DIR/frontend"
nohup npm run dev > /tmp/animescraping-frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "   PID: ${FRONTEND_PID}"
echo ""

# Esperar a que los servicios estén listos
echo -e "${YELLOW}⏳ Esperando servicios...${NC}"
sleep 5

# Verificar que los servicios estén corriendo
if ps -p $BACKEND_PID > /dev/null; then
    echo -e "${GREEN}✅ Backend corriendo en http://localhost:5000${NC}"
else
    echo -e "${RED}❌ Backend falló al iniciar${NC}"
    echo -e "${YELLOW}   Ver logs: tail -f /tmp/animescraping-backend.log${NC}"
    cat /tmp/animescraping-backend.log
    exit 1
fi

if ps -p $FRONTEND_PID > /dev/null; then
    echo -e "${GREEN}✅ Frontend corriendo en http://localhost:5173${NC}"
else
    echo -e "${RED}❌ Frontend falló al iniciar${NC}"
    echo -e "${YELLOW}   Ver logs: tail -f /tmp/animescraping-frontend.log${NC}"
    cat /tmp/animescraping-frontend.log
    exit 1
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🎉 Servicios iniciados exitosamente!${NC}"
echo ""
echo -e "${YELLOW}📋 URLs:${NC}"
echo -e "   • Frontend: ${BLUE}http://localhost:5173${NC}"
echo -e "   • Backend:  ${BLUE}http://localhost:5000${NC}"
echo ""
echo -e "${YELLOW}📝 Logs:${NC}"
echo -e "   • Backend:  tail -f /tmp/animescraping-backend.log"
echo -e "   • Frontend: tail -f /tmp/animescraping-frontend.log"
echo ""
echo -e "${YELLOW}🛑 Para detener:${NC}"
echo -e "   • Backend:  kill ${BACKEND_PID}"
echo -e "   • Frontend: kill ${FRONTEND_PID}"
echo -e "   • Ambos:    kill ${BACKEND_PID} ${FRONTEND_PID}"
echo -e "   • Script:   ./stop-all.sh"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

# Guardar PIDs para referencia
echo "${BACKEND_PID}" > /tmp/animescraping-backend.pid
echo "${FRONTEND_PID}" > /tmp/animescraping-frontend.pid

echo -e "${GREEN}Los servicios están corriendo en background.${NC}"
echo -e "${YELLOW}Puedes cerrar esta terminal sin detener los servicios.${NC}"
echo ""
