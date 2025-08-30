// server.js
'use strict';

// Load .env locally (harmless in Koyeb if no .env present)
try { require('dotenv').config(); } catch {}

// Core
const express = require('express');
const mongoose = require('mongoose');

const app = express();

// Boot log so we SEE something in Koyeb logs even if Mongo fails
console.log(
  'Booting DeveloperConnector...',
  'PORT=', process.env.PORT,
  'NODE_ENV=', process.env.NODE_ENV
);

// ---------- Middleware ----------
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Optional CORS: set CORS_ORIGINS="https://yourapp.vercel.app,https://another.com"
if (process.env.CORS_ORIGINS) {
  try {
    const cors = require('cors');
    const origins = process.env.CORS_ORIGINS.split(',').map(s => s.trim()).filter(Boolean);
    app.use(cors({ origin: origins, credentials: false }));
    console.log('CORS enabled for:', origins);
  } catch {
    console.warn('CORS requested via CORS_ORIGINS but "cors" package not installed.');
  }
}

// ---------- Routes ----------
try { app.use('/api/users', require('./routes/api/users')); } catch { console.warn('routes/api/users missing'); }
try { app.use('/api/profile', require('./routes/api/profile')); } catch { console.warn('routes/api/profile missing'); }
try { app.use('/api/posts', require('./routes/api/posts')); } catch { console.warn('routes/api/posts missing'); }

// Health + friendly root
app.get('/healthz', (_req, res) => res.send('ok'));
app.get('/', (_req, res) => res.send('DeveloperConnector API is running'));

// ---------- Mongo connection (env-first) ----------
function getMongoUri() {
  // 1) Prefer direct env var
  if (process.env.MONGO_URI && process.env.MONGO_URI.startsWith('mongodb')) {
    return { uri: process.env.MONGO_URI, source: 'MONGO_URI' };
  }
  // 2) Support NODE_CONFIG JSON (e.g., {"mongoURI":"...","jwtSecret":"..."})
  if (process.env.NODE_CONFIG) {
    try {
      const cfg = JSON.parse(process.env.NODE_CONFIG);
      if (cfg.mongoURI && typeof cfg.mongoURI === 'string' && cfg.mongoURI.startsWith('mongodb')) {
        return { uri: cfg.mongoURI, source: 'NODE_CONFIG.mongoURI' };
      }
    } catch (_) {}
  }
  // 3) Fall back to "config" package if present
  try {
    const config = require('config');
    const cUri = config.get('mongoURI');
    if (typeof cUri === 'string' && cUri.startsWith('mongodb')) {
      return { uri: cUri, source: 'config mongoURI' };
    }
  } catch (_) {}

  // 4) No valid URI found
  return { uri: null, source: 'none' };
}

async function start() {
  const { uri, source } = getMongoUri();
  if (!uri) {
    console.error('❌ No MongoDB URI found. Set MONGO_URI or NODE_CONFIG.mongoURI (or provide config).');
    process.exit(1);
  }

  // Log a sanitized preview so you can confirm the app is using the right source
  const preview = uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:<hidden>@');
  console.log('🔎 Using Mongo URI from:', source);
  console.log('🔎 URI preview:', preview);

  try {
    // Mongoose 7+: no need for useNewUrlParser/useUnifiedTopology
    await mongoose.connect(uri);
    console.log('✅ Mongo connected');
  } catch (err) {
    console.error('❌ Mongo connect failed:', err && err.message ? err.message : err);
    process.exit(1); // fail fast so you notice in Koyeb
  }

  const PORT = process.env.PORT || 8000;
  app.listen(PORT, () => console.log(`Server on ${PORT}`));
}

start();
