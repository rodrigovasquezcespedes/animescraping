#!/bin/bash

# Script para detener Backend y Frontend

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🛑 Deteniendo servicios de AnimeScaping...${NC}"
echo ""

# Detener por PIDs guardados
if [ -f /tmp/animescraping-backend.pid ]; then
    BACKEND_PID=$(cat /tmp/animescraping-backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        kill $BACKEND_PID
        echo -e "${GREEN}✅ Backend detenido (PID: ${BACKEND_PID})${NC}"
    fi
    rm /tmp/animescraping-backend.pid
fi

if [ -f /tmp/animescraping-frontend.pid ]; then
    FRONTEND_PID=$(cat /tmp/animescraping-frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        kill $FRONTEND_PID
        echo -e "${GREEN}✅ Frontend detenido (PID: ${FRONTEND_PID})${NC}"
    fi
    rm /tmp/animescraping-frontend.pid
fi

# Detener por puerto (fallback)
echo -e "${YELLOW}Verificando puertos...${NC}"

if lsof -ti:5000 > /dev/null 2>&1; then
    lsof -ti:5000 | xargs kill -9 2>/dev/null
    echo -e "${GREEN}✅ Backend en puerto 5000 detenido${NC}"
fi

if lsof -ti:5173 > /dev/null 2>&1; then
    lsof -ti:5173 | xargs kill -9 2>/dev/null
    echo -e "${GREEN}✅ Frontend en puerto 5173 detenido${NC}"
fi

# Limpiar logs
rm -f /tmp/animescraping-backend.log /tmp/animescraping-frontend.log

echo ""
echo -e "${GREEN}✅ Todos los servicios detenidos${NC}"
