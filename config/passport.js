// config/passport.js
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const mongoose = require('mongoose');

// IMPORTANT: require the model file so the schema is registered.
const User = require('../models/User'); // returns the model instance

const getJwtSecret = () => {
  try {
    return process.env.JWT_SECRET || require('config').get('jwtSecret');
  } catch {
    return process.env.JWT_SECRET;
  }
};

// Accept Bearer, plain Authorization, or x-auth-token
const tokenExtractor = (req) => {
  if (!req || !req.headers) return null;

  const auth = req.headers.authorization;
  if (auth) {
    // "Bearer <token>"
    const parts = auth.split(' ');
    if (parts.length === 2 && /^Bearer$/i.test(parts[0])) return parts[1];
    // "Authorization: <token>"
    if (parts.length === 1) return parts[0];
    // "<scheme> <token>" → still try token part
    if (parts.length === 2) return parts[1];
  }
  if (req.headers['x-auth-token']) return req.headers['x-auth-token'];

  return null;
};

const opts = {
  jwtFromRequest: tokenExtractor, // more forgiving than only Bearer
  secretOrKey: getJwtSecret(),
};

module.exports = (passport) => {
  passport.use(
    new JwtStrategy(opts, async (jwtPayload, done) => {
      try {
        // Your login code likely signs: jwt.sign({ id: user.id, ... })
        const id = jwtPayload.id || jwtPayload._id || jwtPayload.sub;
        if (!id) return done(null, false);

        const user = await User.findById(id).select('-password');
        if (user) return done(null, user);
        return done(null, false);
      } catch (err) {
        return done(err, false);
      }
    })
  );
};
