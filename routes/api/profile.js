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
// If you want to delete posts when deleting the profile, import and use Post:
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
router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const profile = await Profile.findOne({ user: req.user.id }).populate("user", ["name", "avatar"]);
      if (!profile) {
        return res.status(404).json({ noprofile: "There is no profile for this user" });
      }
      return res.json(profile);
    } catch (err) {
      return res.status(500).json({ error: "Server error" });
    }
  }
);

/**
 * @route   GET api/profile/all
 * @desc    Get all profiles
 * @access  Public
 */
router.get("/all", async (_req, res) => {
  try {
    const profiles = await Profile.find().populate("user", ["name", "avatar"]);
    return res.json(profiles || []);
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

/**
 * @route   GET api/profile/handle/:handle
 * @desc    Get profile by handle (case-insensitive)
 * @access  Public
 */
router.get("/handle/:handle", async (req, res) => {
  try {
    const handle = String(req.params.handle || "").trim().toLowerCase();
    const profile = await Profile.findOne({ handle }).populate("user", ["name", "avatar"]);
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
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const { errors, isValid } = validateProfileInput(req.body);
    if (!isValid) return res.status(400).json(errors);

    try {
      // Build fields
      const profileFields = { user: req.user.id };
      const normalize = (v) => (typeof v === "string" ? v.trim() : v);

      if (req.body.handle) profileFields.handle = normalize(req.body.handle).toLowerCase();
      if (req.body.company) profileFields.company = normalize(req.body.company);
      if (req.body.website) profileFields.website = normalize(req.body.website);
      if (req.body.location) profileFields.location = normalize(req.body.location);
      if (req.body.bio) profileFields.bio = normalize(req.body.bio);
      if (req.body.status) profileFields.status = normalize(req.body.status);
      if (req.body.githubusername) profileFields.githubusername = normalize(req.body.githubusername);

      if (typeof req.body.skills !== "undefined") {
        profileFields.skills = req.body.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }

      profileFields.social = {};
      ["youtube", "twitter", "facebook", "linkedin", "instagram"].forEach((k) => {
        if (req.body[k]) profileFields.social[k] = normalize(req.body[k]);
      });

      // If handle provided, ensure it's not used by another user
      if (profileFields.handle) {
        const exists = await Profile.findOne({
          handle: profileFields.handle,
          user: { $ne: req.user.id },
        }).lean();
        if (exists) return res.status(400).json({ handle: "That handle already exists" });
      }

      // Upsert profile
      const updated = await Profile.findOneAndUpdate(
        { user: req.user.id },
        { $set: profileFields },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      ).populate("user", ["name", "avatar"]);

      return res.json(updated);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Server error" });
    }
  }
);

/**
 * @route   POST api/profile/experience
 * @desc    Add experience to profile
 * @access  Private
 */
router.post(
  "/experience",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
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
  }
);

/**
 * @route   POST api/profile/education
 * @desc    Add education to profile
 * @access  Private
 */
router.post(
  "/education",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
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
  }
);

/**
 * @route   DELETE api/profile/experience/:exp_id
 * @desc    Delete an experience entry
 * @access  Private
 */
router.delete(
  "/experience/:exp_id",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
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
  }
);

/**
 * @route   DELETE api/profile/education/:edu_id
 * @desc    Delete an education entry
 * @access  Private
 */
router.delete(
  "/education/:edu_id",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
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
  }
);

/**
 * @route   DELETE api/profile
 * @desc    Delete current user's profile (keeps user so they can log in again)
 * @access  Private
 */
router.delete(
  "/",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const userId = req.user.id;

      // If you also want to remove posts, do it here:
      // await Post.deleteMany({ user: userId });

      await Profile.findOneAndDelete({ user: userId }); // profile only
      return res.json({ msg: "Profile deleted" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Server error" });
    }
  }
);

module.exports = router;
