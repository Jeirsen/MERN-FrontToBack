const Router = require("express").Router();

// @route GET api/profile
// @des Test Route
// @access Public
Router.get("/", (req, res) => {
  res.send("Profile route");
});

module.exports = Router;
