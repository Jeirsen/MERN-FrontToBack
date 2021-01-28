const Router = require("express").Router();
const request = require("request");
const config = require("config");
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

// @route DELETE api/profile
// @des   Delete profile, user & post
// @access Private
Router.delete("/", auth, async (req, res) => {
  try {
    //TODO: remove users posts

    // Remove profile
    await Profile.findOneAndRemove({
      user: req.user.id,
    });

    // Remove user
    await User.findOneAndRemove({
      _id: req.user.id,
    });

    return res.status(200).json({ msg: "User deleted" });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      msg: "Server Error",
    });
  }
});

// @route PUT api/profile/experience
// @des   Add profile experience
// @access Private
Router.put(
  "/experience",
  [
    auth,
    [
      check("title", "Title is required").not().isEmpty(),
      check("company", "Company is requied").not().isEmpty(),
      check("from", "From date is requied").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        title,
        company,
        location,
        from,
        to,
        current,
        description,
      } = req.body;

      const newExperience = {
        title,
        company,
        location,
        from,
        to,
        current,
        description,
      };

      const profile = await Profile.findOne({ user: req.user.id });

      if (!profile) {
        return res.status(400).json({ msg: "Profile not found" });
      }

      profile.experience.unshift(newExperience);
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

// @route DELETE api/profile/experience/:exp_id
// @des   Delete experience from profile
// @access Private
Router.delete("/experience/:exp_id", auth, async (req, res) => {
  try {
    let { exp_id } = req.params;
    const profile = await Profile.findOne({ user: req.user.id });

    // Get index to know which experience to remove
    const removeIndex = profile.experience.findIndex(
      (exp) => exp._id.toString() === exp_id
    );

    if (removeIndex >= 0) {
      profile.experience.splice(removeIndex, 1);
      await profile.save();
      return res.status(200).json(profile);
    }

    return res.status(400).json({ msg: "Experience not found" });
  } catch (error) {
    console.log(error.message);
    if (error.kind === "ObjectId") {
      return res.status(500).json({ msg: "Experience not found." });
    }

    return res.status(500).json({
      msg: "Server Error",
    });
  }
});

// @route PUT api/profile/education
// @des   Add profile education
// @access Private
Router.put(
  "/education",
  [
    auth,
    [
      check("school", "School is required").not().isEmpty(),
      check("degree", "Degree is requied").not().isEmpty(),
      check("fieldofstudy", "Field of study is requied").not().isEmpty(),
      check("from", "From date is requied").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description,
      } = req.body;

      const newEducation = {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description,
      };

      const profile = await Profile.findOne({ user: req.user.id });

      if (!profile) {
        return res.status(400).json({ msg: "Profile not found" });
      }

      profile.education.unshift(newEducation);
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

// @route DELETE api/profile/education/:edu_id
// @des   Delete education from profile
// @access Private
Router.delete("/education/:edu_id", auth, async (req, res) => {
  try {
    let { edu_id } = req.params;
    const profile = await Profile.findOne({ user: req.user.id });

    // Get index to know which education to remove
    const removeIndex = profile.education.findIndex(
      (edu) => edu._id.toString() === edu_id
    );

    if (removeIndex >= 0) {
      profile.education.splice(removeIndex, 1);
      await profile.save();
      return res.status(200).json(profile);
    }

    return res.status(400).json({ msg: "Education not found" });
  } catch (error) {
    console.log(error.message);
    if (error.kind === "ObjectId") {
      return res.status(500).json({ msg: "Education not found." });
    }

    return res.status(500).json({
      msg: "Server Error",
    });
  }
});

// @route PUT api/profile/github/:username
// @des   Get user repos from github
// @access Public
Router.get("/github/:username", (req, res) => {
  try {
    const options = {
      uri: `https://api.github.com/users/${
        req.params.username
      }/repos?per_page=5&sort=created:asc&client_id=${config.get(
        "githubClientID"
      )}&client_secret=${config.get("githubSecret")}}`,
      method: "GET",
      headers: { "user-agent": "node.js" },
    };

    request(options, (error, response, body) => {
      if (error) {
        console.log(error);
      }

      if (response.statusCode !== 200) {
        return res.status(404).json({ msg: "No github profile found" });
      }

      res.json(JSON.parse(body));
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      msg: "Server Error",
    });
  }
});

module.exports = Router;
