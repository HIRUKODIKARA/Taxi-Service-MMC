# ---- Build stage: produce the optimized static bundle ----
FROM node:20-slim AS build
WORKDIR /app

# Install deps against the lockfile (reproducible).
COPY package.json package-lock.json ./
RUN npm ci

# Build the production bundle into /app/dist.
COPY . ./
RUN npm run build

# ---- Runtime stage: nginx serves the static files + proxies /api ----
FROM nginx:1.27-alpine AS runtime
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
