# syntax=docker/dockerfile:1.6

FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# ARG para VITE_API_URL en tiempo de build
ARG VITE_API_URL=http://localhost:5000
ENV VITE_API_URL=$VITE_API_URL

ENV NODE_ENV=production
RUN npm run build

FROM nginx:alpine AS runner
# Copiar configuración de nginx personalizada (si existe)
COPY --from=build /app/dist /usr/share/nginx/html

# Crear configuración de nginx para SPA y proxy opcional
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    # Configuración para SPA (React Router) \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    \
    # Cache para assets estáticos \
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
    \
    # Headers de seguridad \
    add_header X-Frame-Options "SAMEORIGIN" always; \
    add_header X-Content-Type-Options "nosniff" always; \
    add_header X-XSS-Protection "1; mode=block" always; \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

