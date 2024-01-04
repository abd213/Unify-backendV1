require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGODB_URI);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

//We import the routes to instruct our server to use them
const userRoutes = require("./routes/user");
const postRoutes = require("./routes/post");
app.use(userRoutes);
app.use(postRoutes);
// We intercept routes that don't exist
app.all("*", (req, res) => {
  res.status(404).json({ error: "Cette Route n'existe pas" });
});

app.listen(process.env.PORT, () => {
  console.log("Server has started !");
});
