const User = require("../models/User");

// On crée ce middlewares pour pour l'utiliser sur toutes les routes qui nécéssitent une vérification
const isAuthenticated = async (req, res, next) => {
  try {
    if (req.headers.authorization) {
      const token = req.headers.authorization.replace("Bearer ", "");
      //   console.log(token);
      const user = await User.findOne({ token: token }).select("account _id");
      if (user) {
        req.user = user;
        next();
      } else {
        res.status(401).json({ error: "Unauthorized" });
      }
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = isAuthenticated;
