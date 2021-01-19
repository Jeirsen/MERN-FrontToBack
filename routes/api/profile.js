const Router = require("express").Router();
const auth = require("../../middleware/auth");
const Profile = require("../../models/Profile");
const User = require("../../models/User");
const { check, validationResult } = require("express-validator/check");

// @route GET api/profile/me
// @des   Get current user profile
// @access Private
Router.get("/me", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    }).populate("user", ["name", "avatar"]);

    if (!profile) {
      return res.status(400).json({ msg: "There is no profile for this user" });
    }

    res.json(profile);
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      msg: "Server Error",
    });
  }
});

// @route GET api/profile
// @des   Create or update user profile
// @access Private
Router.post(
  "/",
  [
    auth,
    [
      check("status", "Status is required").not().isEmpty(),
      check("skills", "Skills is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        company,
        website,
        location,
        bio,
        status,
        githubusername,
        skills,
        youtube,
        facebook,
        twitter,
        instagram,
        linkedin,
      } = req.body;

      // Build Profile Object
      const profileFields = {};
      profileFields.user = req.user.id;
      if (company) profileFields.company = company;
      if (website) profileFields.website = website;
      if (location) profileFields.location = location;
      if (bio) profileFields.bio = bio;
      if (status) profileFields.status = status;
      if (githubusername) profileFields.githubusername = githubusername;

      if (skills) {
        profileFields.skills = skills.split(",").map((skill) => skill.trim());
      }

      // Build Social Object
      profileFields.social = {};
      if (youtube) profileFields.social.youtube = youtube;
      if (twitter) profileFields.social.twitter = twitter;
      if (facebook) profileFields.social.facebook = facebook;
      if (linkedin) profileFields.social.linkedin = linkedin;
      if (instagram) profileFields.social.instagram = instagram;

      let profile = await Profile.findOne({ user: req.user.id });

      if (profile) {
        // Update
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );

        return res.status(200).json(profile);
      }

      // Create
      profile = new Profile(profileFields);
      await profile.save();
      return res.status(200).json(profile);
    } catch (error) {
      console.log(error.message);
      return res.status(500).json({
        msg: "Server Error",
      });
    }
  }
);

// @route GET api/profile
// @des   Get all profiles
// @access Public
Router.get("/", async (req, res) => {
  try {
    const profiles = await Profile.find().populate("user", ["name", "avatar"]);

    res.status(200).json(profiles);
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      msg: "Server Error",
    });
  }
});

// @route GET api/profile/user/_user_id
// @des   Get profile by user ID
// @access Public
Router.get("/user/:user_id", async (req, res) => {
  try {
    console.log(req.params.user_id);
    const profile = await Profile.findOne({
      user: req.params.user_id,
    }).populate("user", ["name", "avatar"]);

    if (!profile) {
      return res.status(400).json({ msg: "Profile not found." });
    }
    res.status(200).json(profile);
  } catch (error) {
    console.log(error.message);

    if (error.kind === "ObjectId") {
      return res.status(500).json({ msg: "Profile not found." });
    }

    return res.status(500).json({
      msg: "Server Error",
    });
  }
});

module.exports = Router;
