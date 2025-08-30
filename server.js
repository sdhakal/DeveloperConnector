'use strict';
require('dotenv').config();

const path = require('path');
const fs = require('fs');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

if (process.env.CLIENT_ORIGIN) {
  app.use(cors({ origin: [process.env.CLIENT_ORIGIN], credentials: true }));
}

// Mongo connection (use MONGO_URI from env)
const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/devconnector';
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB Connected'))
  .catch(err => { console.error('Mongo connection error:', err.message); process.exit(1); });

// API routes (mount if present)
try { app.use('/api/users', require('./routes/api/users')); } catch {}
try { app.use('/api/profile', require('./routes/api/profile')); } catch {}
try { app.use('/api/posts', require('./routes/api/posts')); } catch {}

// Health + friendly root
app.get('/healthz', (req, res) => res.send('ok'));
app.get('/', (req, res) => res.send('DeveloperConnector API is running'));

// Serve React build
const buildPath = path.join(__dirname, 'client', 'build');
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));
  app.get('*', (_req, res) => res.sendFile(path.join(buildPath, 'index.html')));
} else {
  console.warn('client/build not found — ensure postinstall builds the client');
}

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server on ${port}`));
