# The web app for Cloud Run: Vite build, served by nginx on $PORT.
# Build from the repository root:
#   docker build -f platform/web/Dockerfile --build-arg VITE_API_URL=https://vt-api.example.com .
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
ARG VITE_BASE=/
ARG VITE_API_URL=
ENV VITE_BASE=$VITE_BASE VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:1.27-alpine
COPY platform/web/nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
ENV PORT=8080
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q -O /dev/null http://127.0.0.1:${PORT}/ || exit 1
