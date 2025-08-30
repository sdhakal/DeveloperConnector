const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProfileSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'users', required: true, index: true },

  // Make handle required, trimmed, lowercased, and unique
  handle: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    unique: true,
    maxlength: 40
  },

  company: String,
  website: String,
  location: String,
  status: { type: String, required: true },
  skills: { type: [String], default: [] },
  bio: String,
  githubusername: String,

  experience: [
    {
      title: { type: String, required: true },
      company: { type: String, required: true },
      location: String,
      from: { type: Date, required: true },
      to: Date,
      current: { type: Boolean, default: false },
      description: String
    }
  ],
  education: [
    {
      school: { type: String, required: true },
      degree: { type: String, required: true },
      fieldofstudy: { type: String, required: true },
      from: { type: Date, required: true },
      to: Date,
      current: { type: Boolean, default: false },
      description: String
    }
  ],
  social: {
    youtube: String,
    twitter: String,
    facebook: String,
    linkedin: String,
    instagram: String
  },
  date: { type: Date, default: Date.now }
});

// In case the unique index wasn’t built yet:
ProfileSchema.index({ handle: 1 }, { unique: true });

module.exports = mongoose.model('profile', ProfileSchema);
