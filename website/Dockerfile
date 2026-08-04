FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci || npm install

COPY . .

# Receber ARGs de ambiente do Easypanel para o build do Next.js
ARG BACKEND_INTERNAL_URL
ARG NEXT_PUBLIC_LOGIN_URL
ARG GIT_SHA

# Exportar como variáveis de ambiente para a fase de build e runtime
ENV BACKEND_INTERNAL_URL=$BACKEND_INTERNAL_URL \
    NEXT_PUBLIC_LOGIN_URL=$NEXT_PUBLIC_LOGIN_URL \
    GIT_SHA=$GIT_SHA

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
