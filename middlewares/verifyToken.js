const jwt = require("jsonwebtoken");
const User = require("../models/User");

const verifyToken = async (req, res, next) => {
  let accessToken;

  if (req.cookies && req.cookies.accessToken) {
    accessToken = req.cookies.accessToken;
  }

  if (!accessToken) {
    return res.status(401).json({ msg: "NoAccessTokenInCookie" });
  }

  try {
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({ msg: "User is not existed" });
    }
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ msg: "AccessTokenExpired" });
    } else if (err.name === "JsonWebTokenError") {
      console.error(" Access Token invalid:", err.message);
      return res
        .status(401)
        .json({ msg: "Access Token is invalid. Login again." });
    } else {
      console.error(" Access Token err:", err.message);
      return res.status(500).json({ msg: "server err" });
    }
  }
};

module.exports = verifyToken;
