const mongoose = require("mongoose");

// We declare our model User and assign it the name of the collection.
const User = mongoose.model("User", {
  email: {
    unique: true,
    required: true,
    type: String,
    lowercase: true,
  },
  account: {
    username: {
      required: true,
      type: String,
    },
    avatar: Object,
  },
  birthDate: Date,
  team: String,
  newsletter: Boolean,
  token: String,
  hash: String,
  salt: String,
  bio: {
    type: String,
    max: 1000,
  },
  followers: {
    type: [String],
  },
  following: {
    type: [String],
  },
  likes: {
    type: [String],
  },
});

module.exports = User;
