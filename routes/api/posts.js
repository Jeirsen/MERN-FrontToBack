const Router = require("express").Router();

// @route GET api/posts
// @des Test Route
// @access Public
Router.get("/", (req, res) => {
  res.send("Post route");
});

module.exports = Router;
