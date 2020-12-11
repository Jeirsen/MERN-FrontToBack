const Router = require("express").Router();
const validateToken = require('../../middleware/auth')
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const User = require('../../models/User')

// @route GET api/auth
// @des Test Route
// @access Public
Router.get("/", validateToken, async (req, res) => {
 try {
   let { user } = req
   const foundUser = await User.findById(user.id).select('-password')
   res.json(foundUser)
 } catch (error) {
   console.log(error.message)
   res.status(500).json({msg: 'Server error'})
 }
});

// @route POST api/login
// @des Authenticate user and get token
// @access Public
Router.post(
  "/login",
  [
    check("email", "Please include a valid email").isEmail(),
    check(
      "password",
      "Password is required"
    ).exists(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
        });
      }

      const { email, password } = req.body;
      let user = await User.findOne({ email });

      if (!user) {
        return res.status(400).json({
          errors: [{ msg: "Invalid credentials" }],
        });
      }

      const isMatch = await bcrypt.compare(password, user.password)

      if(!isMatch){
        return res.status(400).json({
          errors: [{ msg: "Invalid credentials" }],
        });
      }

      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        payload,
        config.get("JWTSecret"),
        { expiresIn: 36000 },
        (error, token) => {
          if (error) throw error;
          res.json({ token });
        }
      );
    } catch (error) {
      console.log(error.message);
      return res.status(500).json({
        msg: "Server Error"
      });
    }
  }
);

module.exports = Router;
