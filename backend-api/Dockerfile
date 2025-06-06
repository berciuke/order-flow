ARG NODE_ENV=development

# Etap budowania (tylko dla produkcji)
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Etap deweloperski (używa ts-node)
FROM node:18-alpine AS development
WORKDIR /app
RUN apk add --no-cache curl git
COPY package*.json ./
RUN npm ci
COPY . .
# Generuj Prisma client dla developmentu
RUN npx prisma generate
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app
USER nodejs
EXPOSE ${PORT:-8000}
CMD ["npm", "run", "dev"]

# Etap produkcyjny 
FROM node:18-alpine AS production
WORKDIR /app
RUN apk add --no-cache curl
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
ARG PORT=8000
ENV PORT=${PORT}
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
# ewentualna dokumentacja np. swagger:
# COPY --from=builder /app/public ./public
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app/dist /app/node_modules
USER nodejs
EXPOSE ${PORT:-8000}
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
CMD curl -f http://localhost:${PORT:-8000}/health || exit 1
CMD ["node", "dist/server.js"] 