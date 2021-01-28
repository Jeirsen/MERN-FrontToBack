const Router = require("express").Router();
const { check, validationResult } = require("express-validator");
const auth = require("../../middleware/auth");

const Post = require("../../models/Post");
const Profile = require("../../models/Profile");
const User = require("../../models/User");

// @route GET api/posts
// @des Create a post
// @access Private
Router.post(
  "/",
  [auth, [check("text", "Text is required").not().isEmpty()]],
  async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(404).json({ errors: errors.array() });
      }

      let { text } = req.body;
      const user = await User.findById(req.user.id).select("-password");

      const newPost = new Post({
        text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      });

      const post = await newPost.save();

      res.status(200).json(post);
    } catch (error) {
      console.log(error.message);
      return res.status(500).json({
        msg: "Server Error",
      });
    }
  }
);

// @route GET api/posts
// @des   Get all posts
// @access Private
Router.get("/", auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      msg: "Server Error",
    });
  }
});

// @route GET api/posts/:id
// @des   Get post by id
// @access Private
Router.get("/:id", auth, async (req, res) => {
  try {
    let { id } = req.params;
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    res.json(post);
  } catch (error) {
    console.log(error.message);

    if (error.kind === "ObjectId") {
      return res.status(404).json({ msg: "Post not found." });
    }

    return res.status(500).json({
      msg: "Server Error",
    });
  }
});

// @route DELETE api/posts/:id
// @des   Delete post
// @access Private
Router.delete("/:id", auth, async (req, res) => {
  try {
    let { id } = req.params;
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    // check if post belongs to user
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }

    await post.remove();

    res.json({ msg: "Post removed" });
  } catch (error) {
    console.log(error.message);

    if (error.kind === "ObjectId") {
      return res.status(404).json({ msg: "Post not found." });
    }

    return res.status(500).json({
      msg: "Server Error",
    });
  }
});

// @route PUT api/posts/like/:id
// @des   Like a post
// @access Private
Router.put("/like/:id", auth, async (req, res) => {
  try {
    let { id } = req.params;
    const post = await Post.findById(id);

    // check if post has already been like
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id).length >
      0
    ) {
      const removeIndex = post.likes
        .map((like) => like.user.toString())
        .indexOf(req.user.id);
      post.likes.splice(removeIndex, 1);
    } else {
      post.likes.unshift({ user: req.user.id });
    }

    await post.save();

    res.json(post.likes);
  } catch (error) {
    console.log(error.message);

    if (error.kind === "ObjectId") {
      return res.status(404).json({ msg: "Post not found." });
    }

    return res.status(500).json({
      msg: "Server Error",
    });
  }
});

// @route GET api/posts/:id/comment
// @des   Comment on a post
// @access Private
Router.post(
  "/:id/comment",
  [auth, [check("text", "Text is required").not().isEmpty()]],
  async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(404).json({ errors: errors.array() });
      }

      let { text } = req.body;
      let { id } = req.params;

      const user = await User.findById(req.user.id).select("-password");
      const post = await Post.findById(id);

      const newComment = new Post({
        text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      });

      post.comments.unshift(newComment);
      await post.save();

      res.status(200).json(post.comments);
    } catch (error) {
      console.log(error.message);

      if (error.kind === "ObjectId") {
        return res.status(404).json({ msg: "Post not found." });
      }

      return res.status(500).json({
        msg: "Server Error",
      });
    }
  }
);

// @route DELETE api/posts/:id/comment/:comment_id
// @des   Delete comment
// @access Private
Router.delete("/:id/comment/:comment_id", auth, async (req, res) => {
  try {
    let { id, comment_id } = req.params;
    const post = await Post.findById(id);

    // Pull out comment
    const comment = post.comments.find(
      (comment) => comment.id.toString() === comment_id
    );

    if (!comment) {
      return res.status(404).json({ msg: "Comment does not exist" });
    }

    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }

    const removeIndex = post.comments
      .map((comment) => comment.user.toString())
      .indexOf(req.user.id);
    post.comments.splice(removeIndex, 1);

    await post.save();

    res.status(200).json(post.comments);
  } catch (error) {
    console.log(error.message);

    if (error.kind === "ObjectId") {
      return res.status(404).json({ msg: "Post not found." });
    }

    return res.status(500).json({
      msg: "Server Error",
    });
  }
});

module.exports = Router;
