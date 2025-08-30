// server.js
'use strict';

// Optional: harmless locally; ignored on Koyeb if no .env present
try { require('dotenv').config(); } catch {}

const fs = require('fs');
const express = require('express');
const mongoose = require('mongoose');

const app = express();

// Boot log so we SEE something in Koyeb logs even if Mongo fails
console.log(
  'Booting DeveloperConnector...',
  'PORT=', process.env.PORT,
  'NODE_ENV=', process.env.NODE_ENV
);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ---- Mongo ----
const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/devconnector';
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB Connected'))
  .catch(err => {
    console.error('Mongo connection error:', err && err.message ? err.message : err);
    // Do NOT exit: keep process alive so logs are visible.
  });

// ---- API routes (mount if present) ----
try { app.use('/api/users', require('./routes/api/users')); } catch { console.warn('routes/api/users missing'); }
try { app.use('/api/profile', require('./routes/api/profile')); } catch { console.warn('routes/api/profile missing'); }
try { app.use('/api/posts', require('./routes/api/posts')); } catch { console.warn('routes/api/posts missing'); }

// ---- Health + friendly root ----
app.get('/healthz', (_req, res) => res.send('ok'));
app.get('/', (_req, res) => res.send('DeveloperConnector API is running'));
const path = require('path');
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client', 'build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
  });
}
// ---- Serve CRA build if present ----
const buildPath = path.join(__dirname, 'client', 'build');
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
} else {
  console.warn('client/build not found — ensure postinstall builds the client');
}

// ---- Listen on platform port ----
const PORT = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server on ${port}`));
