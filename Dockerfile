FROM node:18-alpine

# 1) App setup
WORKDIR /app
COPY package*.json ./
RUN npm ci

# 2) Client deps + build
COPY client/package*.json client/
RUN npm install --prefix client

# 3) Copy the rest, then build client
COPY . .
# CRA + webpack requires this on Node 18 sometimes
ENV NODE_OPTIONS=--openssl-legacy-provider
RUN npm run build --prefix client

# 4) Runtime
ENV NODE_ENV=production
ENV PORT=8000
EXPOSE 8000
CMD ["node", "server.js"]
