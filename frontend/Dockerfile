# Etap budowania
FROM node:18-alpine AS builder

ARG PUBLIC_URL=/
ENV PUBLIC_URL=${PUBLIC_URL}

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm install --frozen-lockfile

COPY . .

RUN npm run build

# Etap serwowania
FROM nginx:alpine

ARG NGINX_PORT=80
ENV NGINX_PORT=${NGINX_PORT}

COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE ${NGINX_PORT}

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget --quiet --tries=1 --spider http://localhost:${NGINX_PORT}/ || exit 1

CMD ["nginx", "-g", "daemon off;"] 