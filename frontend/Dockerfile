# ------------------------------------------------------
# 1) Etap budowania React
FROM node:18-alpine AS builder

# Zdefiniuj argument, który przyjmie wartość podczas docker-compose build
ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=${REACT_APP_BACKEND_URL}

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --frozen-lockfile
COPY . .
RUN npm run build

# ------------------------------------------------------
# 2) Etap serwowania plików przez Nginx
FROM nginx:alpine

ARG NGINX_PORT=80
ENV NGINX_PORT=${NGINX_PORT}

# Skopiuj wygenerowane pliki React do katalogu Nginx
COPY --from=builder /app/build /usr/share/nginx/html

# Skopiuj naszą konfigurację Nginx, która reguluje proxy /api
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE ${NGINX_PORT}
CMD ["nginx", "-g", "daemon off;"] 