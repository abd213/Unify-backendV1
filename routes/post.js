const express = require("express");
const router = express.Router();
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;

const Post = require("../models/Post");
const User = require("../models/User");
const isAuthenticated = require("../middlewares/isAuthenticated");

const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

// Route to create a post
router.post(
  "/post/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      const newPost = await new Post({
        owner: req.user,
        message: req.body.message,
        video: req.body.video,
        likers: [],
        comments: [],
        dateOfPost: new Date().getTime(),
      });

      const result = await cloudinary.uploader.upload(
        convertToBase64(req.files.picture)
      );
      newPost.picture = result;
      //   console.log(result);
      await newPost.save();
      res.status(201).json(newPost);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

//Route to retrieve a post based on the ID
router.get("/post/:id", async (req, res) => {
  try {
    const id = req.params.id;
    if (id) {
      const post = await Post.findById(id).sort({ dateOfPost: -1 });
      if (post) {
        res.status(200).json({ post });
      } else {
        res.status(400).json({ error: "ID unknown" });
      }
    } else {
      res.status(400).json({ error: "Missing parameter" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Route to modify a post by passing the ID as params
router.put("/api/post/:id", isAuthenticated, async (req, res) => {
  try {
    const id = req.params.id;
    const { message } = req.body;
    if (id) {
      const postToUpdate = await Post.findById(id);
      if (postToUpdate) {
        postToUpdate.message = message;
        await postToUpdate.save();
        res.status(200).json({ postToUpdate });
      } else {
        res.status(400).json({ error: "ID unknown" });
      }
    } else {
      res.status(400).json({ error: "Missing parameter" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Route to delete a post by passing the ID as params
router.delete("/api/delete-post/:id", isAuthenticated, async (req, res) => {
  try {
    const id = req.params.id;
    if (id) {
      const postToDelete = await Post.findById(id);
      if (postToDelete) {
        await postToDelete.deleteOne();
        res.status(200).json({ message: "post successfully deleted" });
      } else {
        res.status(400).json({ error: "ID unknown" });
      }
    } else {
      res.status(400).json({ error: "Missing parameter" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Route to like a post
router.patch("/post/like/:id", isAuthenticated, async (req, res) => {
  try {
    const id = req.params.id;
    const { idWhoLike } = req.body;
    if (id || idWhoLike) {
      const post = await Post.findById(id);
      const user = await User.findById(idWhoLike);
      if (user && post) {
        // We add the ID of the user who liked to the 'likers' array of the post
        const postToLike = await Post.findByIdAndUpdate(
          id,
          { $addToSet: { likers: idWhoLike } },
          { new: true }
        );
        // We add the ID of the post to the user who has liked it
        const userWhoLike = await User.findByIdAndUpdate(
          idWhoLike,
          { $addToSet: { likes: id } },
          { new: true }
        );
        res.status(201).json(userWhoLike);
      } else {
        res.status(200).json({ message: "ID unknown" });
      }
    } else {
      res.status(400).json({ error: "Missing parameter" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Route to unlike a post
router.patch("/post/unlike/:id", isAuthenticated, async (req, res) => {
  try {
    const id = req.params.id;
    const { idWhoUnlike } = req.body;
    if (id || idWhoUnlike) {
      const post = await Post.findById(id);
      const user = await User.findById(idWhoUnlike);
      if (user && post) {
        // We remove the 'like' from the post's array
        const postToUnlike = await Post.findByIdAndUpdate(
          id,
          { $pull: { likers: idWhoUnlike } },
          { new: true }
        );

        // We remove the ID of the post from the user who liked it
        const userWhoUnlike = await User.findByIdAndUpdate(
          idWhoUnlike,
          { $pull: { likes: id } },
          { new: true }
        );
        res.status(201).json(userWhoUnlike);
      } else {
        res.status(200).json({ message: "ID unknown" });
      }
    } else {
      res.status(400).json({ message: "missing parameter" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Route to add comments to the post
router.patch("/post/comment/:id", isAuthenticated, async (req, res) => {
  try {
    const id = req.params.id;
    const { commenterId, commenterPseudo, text } = req.body;
    if (id) {
      const post = await Post.findById(id);
      if (post) {
        const postToComment = await Post.findByIdAndUpdate(
          id,
          {
            $push: {
              comments: {
                commenterId: commenterId,
                commenterPseudo: commenterPseudo,
                text: text,
                timestamp: new Date().getTime(),
              },
            },
          },
          { new: true }
        );
        res.status(200).json(postToComment);
      } else {
        res.status(400).json({ message: "ID unknown" });
      }
    } else {
      res.status(400).json({ message: "missing parameter" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Route to edit a comment
router.patch("/post/edit-comment/:id", isAuthenticated, async (req, res) => {
  try {
    const id = req.params.id;
    const { commentId, text } = req.body;
    const post = await Post.findById(id);

    if (id) {
      if (post) {
        const postToUpdate = await Post.updateOne(
          { _id: id, "comments._id": commentId },
          { $set: { "comments.$.text": text } }
        );
        res.status(200).json(postToUpdate);
      } else {
        res.status(400).json({ message: "ID unknown" });
      }
    } else {
      res.status(400).json({ message: "missing parameter" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Route to delete post
router.patch("/post/delete-comment/:id", isAuthenticated, async (req, res) => {
  try {
    const id = req.params.id;
    const { commentId } = req.body;
    const post = await Post.findById(id);
    if (id && commentId) {
      if (post) {
        const postToUpdate = await Post.findByIdAndUpdate(
          id,
          {
            $pull: {
              comments: {
                _id: commentId,
              },
            },
          },
          {
            new: true,
          }
        );
        res.status(200).json(postToUpdate);
      } else {
        res.status(400).json({ message: "ID unknown" });
      }
    } else {
      res.status(400).json({ message: "missing parameter" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
