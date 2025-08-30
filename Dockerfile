FROM node:18-alpine

# 1) App setup
WORKDIR /app

# Copy only root package files first, install WITHOUT scripts so postinstall won't run
COPY package*.json ./
RUN npm ci --ignore-scripts

# 2) Client deps (copy only its package files first)
COPY client/package*.json client/
RUN npm ci --prefix client

# 3) Copy the rest of the source
COPY . .

# 4) Build the client explicitly (no postinstall)
ENV NODE_OPTIONS=--openssl-legacy-provider
RUN npm run build --prefix client

# 5) Runtime
ENV NODE_ENV=production
ENV PORT=8000
EXPOSE 8000
CMD ["node","server.js"]
