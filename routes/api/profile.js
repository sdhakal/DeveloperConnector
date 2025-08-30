// routes/api/profile.js
"use strict";

const express = require("express");
const router = express.Router();
const passport = require("passport");

// Validation
const validateProfileInput = require("../../validation/profile");
const validateExperienceInput = require("../../validation/experience");
const validateEducationInput = require("../../validation/education");

// Models
const Profile = require("../../models/Profile");
const User = require("../../models/User");
// If you want to remove a user's posts on account delete, uncomment the next line
// const Post = require("../../models/Post");

/**
 * @route   GET api/profile/test
 * @desc    Tests profile route
 * @access  Public
 */
router.get("/test", (_req, res) => res.json({ msg: "Profile works" }));

/**
 * @route   GET api/profile
 * @desc    Get current user's profile
 * @access  Private
 */
router.get("/", passport.authenticate("jwt", { session: false }), async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id }).populate("user", ["name", "avatar"]);
    if (!profile) {
      return res.status(404).json({ noprofile: "There is no profile for this user" });
    }
    return res.json(profile);
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

/**
 * @route   GET api/profile/all
 * @desc    Get all profiles
 * @access  Public
 */
router.get("/all", async (_req, res) => {
  try {
    const profiles = await Profile.find().populate("user", ["name", "avatar"]);
    // Return empty array instead of 404 when there are no profiles
    return res.json(profiles || []);
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

/**
 * @route   GET api/profile/handle/:handle
 * @desc    Get profile by handle
 * @access  Public
 */
router.get("/handle/:handle", async (req, res) => {
  try {
    const profile = await Profile.findOne({ handle: req.params.handle }).populate("user", ["name", "avatar"]);
    if (!profile) {
      return res.status(404).json({ noprofile: "There is no profile for this user" });
    }
    return res.json(profile);
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

/**
 * @route   GET api/profile/user/:user_id
 * @desc    Get profile by user id
 * @access  Public
 */
router.get("/user/:user_id", async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.params.user_id }).populate("user", ["name", "avatar"]);
    if (!profile) {
      return res.status(404).json({ noprofile: "There is no profile for this user" });
    }
    return res.json(profile);
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

/**
 * @route   POST api/profile
 * @desc    Create or update current user's profile
 * @access  Private
 */
router.post("/", passport.authenticate("jwt", { session: false }), async (req, res) => {
  const { errors, isValid } = validateProfileInput(req.body);

  if (!isValid) {
    return res.status(400).json(errors);
  }

  try {
    // Build profile fields
    const profileFields = { user: req.user.id };
    const setIf = (k) => {
      if (req.body[k]) profileFields[k] = req.body[k];
    };

    setIf("handle");
    setIf("company");
    setIf("website");
    setIf("location");
    setIf("bio");
    setIf("status");
    setIf("githubusername");

    if (typeof req.body.skills !== "undefined") {
      profileFields.skills = req.body.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    profileFields.social = {};
    ["youtube", "twitter", "facebook", "linkedin", "instagram"].forEach((k) => {
      if (req.body[k]) profileFields.social[k] = req.body[k];
    });

    // If updating, ensure handle (if provided) isn't already used by another user
    if (profileFields.handle) {
      const existingWithHandle = await Profile.findOne({
        handle: profileFields.handle,
        user: { $ne: req.user.id },
      });
      if (existingWithHandle) {
        return res.status(400).json({ handle: "That handle already exists" });
      }
    }

    // Upsert profile (create if missing, update if present)
    const updated = await Profile.findOneAndUpdate(
      { user: req.user.id },
      { $set: profileFields },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).populate("user", ["name", "avatar"]);

    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

/**
 * @route   POST api/profile/experience
 * @desc    Add experience to profile
 * @access  Private
 */
router.post("/experience", passport.authenticate("jwt", { session: false }), async (req, res) => {
  const { errors, isValid } = validateExperienceInput(req.body);
  if (!isValid) return res.status(400).json(errors);

  try {
    const profile = await Profile.findOne({ user: req.user.id });
    if (!profile) return res.status(404).json({ noprofile: "Profile not found" });

    const newExp = {
      title: req.body.title,
      company: req.body.company,
      location: req.body.location,
      from: req.body.from,
      to: req.body.to,
      current: req.body.current,
      description: req.body.description,
    };

    profile.experience.unshift(newExp);
    await profile.save();
    return res.json(profile);
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

/**
 * @route   POST api/profile/education
 * @desc    Add education to profile
 * @access  Private
 */
router.post("/education", passport.authenticate("jwt", { session: false }), async (req, res) => {
  const { errors, isValid } = validateEducationInput(req.body);
  if (!isValid) return res.status(400).json(errors);

  try {
    const profile = await Profile.findOne({ user: req.user.id });
    if (!profile) return res.status(404).json({ noprofile: "Profile not found" });

    const newEdu = {
      school: req.body.school,
      degree: req.body.degree,
      fieldofstudy: req.body.fieldofstudy,
      from: req.body.from,
      to: req.body.to,
      current: req.body.current,
      description: req.body.description,
    };

    profile.education.unshift(newEdu);
    await profile.save();
    return res.json(profile);
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

/**
 * @route   DELETE api/profile/experience/:exp_id
 * @desc    Delete experience from profile
 * @access  Private
 */
router.delete("/experience/:exp_id", passport.authenticate("jwt", { session: false }), async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    if (!profile) return res.status(404).json({ noprofile: "Profile not found" });

    const idx = profile.experience.map((item) => item.id).indexOf(req.params.exp_id);
    if (idx === -1) return res.status(404).json({ experience: "Experience not found" });

    profile.experience.splice(idx, 1);
    await profile.save();
    return res.json(profile);
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

/**
 * @route   DELETE api/profile/education/:edu_id
 * @desc    Delete education from profile
 * @access  Private
 */
router.delete("/education/:edu_id", passport.authenticate("jwt", { session: false }), async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    if (!profile) return res.status(404).json({ noprofile: "Profile not found" });

    const idx = profile.education.map((item) => item.id).indexOf(req.params.edu_id);
    if (idx === -1) return res.status(404).json({ education: "Education not found" });

    profile.education.splice(idx, 1);
    await profile.save();
    return res.json(profile);
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

/**
 * @route   DELETE api/profile
 * @desc    Delete current user's profile & account
 * @access  Private
 */
router.delete("/", passport.authenticate("jwt", { session: false }), async (req, res) => {
  try {
    const userId = req.user.id;

    // If you want to remove posts as well, uncomment:
    // await Post.deleteMany({ user: userId });

    await Profile.findOneAndDelete({ user: userId });
    await User.findByIdAndDelete(userId);

    return res.json({ msg: "Account deleted" });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
