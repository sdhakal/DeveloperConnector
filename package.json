// server.js
'use strict';

require('dotenv').config(); // safe if .env is absent in production

const path = require('path');
const fs = require('fs');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// ---------- Middleware ----------
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Optional CORS (useful if frontend is on a different domain, e.g. Vercel)
if (process.env.CLIENT_ORIGIN) {
  app.use(
    cors({
      origin: [process.env.CLIENT_ORIGIN],
      credentials: true,
    })
  );
}

// ---------- MongoDB ----------
const loadKeys = () => {
  try {
    // config/keys.js should export { mongoURI, secretOrKey }
    // and choose keys_dev vs keys_prod
    // (This lets you keep your existing keys_* files.)
    // eslint-disable-next-line global-require
    return require('./config/keys');
  } catch {
    return {};
  }
};

const { mongoURI: keysMongoURI } = loadKeys();
const mongoURI = process.env.MONGO_URI || keysMongoURI || 'mongodb://127.0.0.1:27017/devconnector';

mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => {
    console.error('Mongo connection error:', err.message);
    process.exitCode = 1;
  });

// ---------- Auth (optional, only if present) ----------
try {
  // If your repo has ./config/passport.js and uses JWT:
  // const passport = require('passport');
  // require('./config/passport')(passport);
  // app.use(passport.initialize());
} catch (e) {
  console.warn('Passport config not found, continuing without it.');
}

// ---------- API Routes ----------
const mountIfExists = (mountPath, filePath) => {
  try {
    // eslint-disable-next-line global-require
    const router = require(filePath);
    app.use(mountPath, router);
    console.log(`Mounted ${mountPath} -> ${filePath}`);
  } catch {
    console.warn(`Route not found: ${filePath} (skipped)`);
  }
};

mountIfExists('/api/users', './routes/api/users');
mountIfExists('/api/profile', './routes/api/profile');
mountIfExists('/api/posts', './routes/api/posts');

// ---------- Health & friendly root ----------
app.get('/healthz', (_req, res) => res.send('ok'));
app.get('/', (_req, res) => res.send('DeveloperConnector API is running'));

// ---------- Serve React build (client/build) ----------
const buildPath = path.join(__dirname, 'client', 'build');
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));
  // SPA fallback: send index.html for unknown routes
  app.get('*', (_req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
} else {
  console.warn('client/build not found. If deploying to Koyeb, ensure the client build runs during build (see postinstall).');
}

// ---------- Start server ----------
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server on ${port}`));
