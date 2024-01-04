const express = require("express");
const router = express.Router();
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");

const User = require("../models/User");

// Route to create a user
router.post("/user/signup", async (req, res) => {
  try {
    console.log(req.body);
    const { username, email, password, newsletter, birthDate, team, bio } =
      req.body;
    if (username) {
      // We check if the email does not exist in the 'user' collection of the database
      const user = await User.findOne({ email: email });
      if (!user) {
        // We create a token from a random string and choose a length of 64 characters
        const token = uid2(64);
        // We generate a random string for the salt of length 16
        const salt = uid2(16);
        // We declare a hash variable that is equal to the encryption of the received password concatenated with the generated salt
        const hash = SHA256(password + salt).toString(encBase64);
        const newUser = new User({
          email: email,
          account: {
            username: username,
          },
          team: team,
          birthDate: birthDate,
          bio: bio,
          newsletter: newsletter,
          token: token,
          salt: salt,
          hash: hash,
        });
        await newUser.save(); // save a new User
        // We send back everything to the user except the hash and salt
        res.json({
          _id: newUser._id,
          token: newUser.token,
          account: newUser.account,
          team: newUser.team,
          birthDate: newUser.birthDate,
        });
      } else {
        res.status(409).json({ error: "Email already used" });
      }
    } else {
      res.status(400).json({ error: "Username is required" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Route to login
router.post("/user/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    // We check if the email does not exist in the 'user' collection of the database
    const user = await User.findOne({ email: email });
    if (user) {
      //We create a new hash from the received password and check if it matches the user's hash
      const newHash = SHA256(password + user.salt).toString(encBase64);
      if (newHash === user.hash) {
        res.status(201).json({
          _id: user._id,
          token: user.token,
          account: user.account,
          team: user.team,
          birthDate: user.birthDate,
        });
      } else {
        res.status(401).json({ error: "Unauthorized" });
      }
    } else {
      res.status(401).json({ error: "Unauthorized" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Route to get all users
router.get("/api/user", async (req, res) => {
  try {
    // We retrieve all users from our database and send back all information except for the salt and hash
    const users = await User.find().select("-salt -hash");
    res.status(201).json(users);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Route to retrieve a user based on the ID
router.get("/api/user/:id", async (req, res) => {
  try {
    const id = req.params.id;
    if (id) {
      const user = await User.findById(id);
      ("");
      if (user) {
        res.status(201).json({ user });
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

// Route to modify a user by passing the ID as params
router.put("/api/user/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { username, email, password, newsletter, birthDate, team, bio } =
      req.body;
    if (id) {
      const userToUpdate = await User.findById(id);
      if (userToUpdate) {
        if (username) {
          userToUpdate.username = username;
        }
        if (newsletter) {
          userToUpdate.newsletter = newsletter;
        }
        if (birthDate) {
          userToUpdate.birthDate = birthDate;
        }
        if (team) {
          userToUpdate.team = team;
        }
        if (bio) {
          userToUpdate.bio = bio;
        }
        await userToUpdate.save();
        res.status(200).json({ userToUpdate });
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

// Route to delete a user by passing the ID as params
router.delete("/api/user/:id", async (req, res) => {
  try {
    const id = req.params.id;
    if (id) {
      const userToDelete = await User.findById(id);
      if (userToDelete) {
        await userToDelete.deleteOne();
        res.status(200).json({ message: "user successfully deleted" });
      } else {
        res.status(200).json({ message: "ID unknown" });
      }
    } else {
      res.status(200).json({ message: "missing parameter" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Route for the follow
router.patch("/user/follow/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { idToFollow } = req.body;
    if (id || idToFollow) {
      const user = await User.findById(id);
      const userToFollow = await User.findById(idToFollow);

      if (user && userToFollow) {
        //If the user is found, then we add them to the subscription list
        const user = await User.findByIdAndUpdate(
          id,
          { $addToSet: { following: idToFollow } },
          { new: true, upsert: true }
        );

        // You also need to add the user who is following to the followers of the user being followed
        const userToFollow = await User.findByIdAndUpdate(
          req.body.idToFollow,
          { $addToSet: { followers: id } },
          { new: true, upsert: true }
        );
        res.status(201).json(user);
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

// Route for unfollow
router.patch("/user/unfollow/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { idToUnfollow } = req.body;
    if (id || idToUnfollow) {
      const user = await User.findById(id);
      const userToUnfollow = await User.findById(idToUnfollow);
      ///If the user is found, then we remove it to the subscription list
      if (user && userToUnfollow) {
        const user = await User.findByIdAndUpdate(
          id,
          { $pull: { following: idToUnfollow } },
          { new: true, upsert: true }
        );

        // You also need to remove the user who is following to the followers of the user being followed
        const userToUnfollow = await User.findByIdAndUpdate(
          req.body.idToUnfollow,
          { $pull: { followers: id } },
          { new: true, upsert: true }
        );
        res.status(201).json(user);
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
