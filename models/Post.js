const mongoose = require("mongoose");

const Post = mongoose.model("Post", {
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  message: {
    type: String,
    trim: true,
    maxLength: 320,
  },
  picture: Object,
  video: {
    type: String,
  },
  likers: {
    type: [String],
    required: true,
  },
  comments: {
    type: [
      {
        commenterId: String,
        commenterPseudo: String,
        text: String,
        timestamp: Date,
      },
    ],
    required: true,
  },
  dateOfPost: Date,
});

module.exports = Post;
