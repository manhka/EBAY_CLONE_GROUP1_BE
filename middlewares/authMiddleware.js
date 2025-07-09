const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  try {
    const token = req.cookies.accessToken;
    if (!token) {
      return res.status(401).json({ msg: "NoAccessTokenInCookie" });
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ msg: "InvalidAccessToken" });
      }
      req.userId = decoded.id || decoded._id || decoded.userId;
      next();
    });
  } catch (err) {
    return res.status(401).json({ msg: "Authentication failed" });
  }
};
module.exports = { auth };
