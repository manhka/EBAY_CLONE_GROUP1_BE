const jwt = require("jsonwebtoken");
const User = require("../models/User"); // Giả sử bạn có User model

const verifyToken = async (req, res, next) => {
  let accessToken;

  if (req.cookies && req.cookies.accessToken) {
    accessToken = req.cookies.accessToken;
  }

  if (!accessToken) {
    // Nếu không có Access Token, ủy quyền bị từ chối ngay lập tức.
    // Điều này cũng bao gồm trường hợp hacker gửi yêu cầu mà không có token.
    return res.status(401).json({ msg: "NoAccessTokenInCookie" });
  }

  try {
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      // Token hợp lệ về mặt cú pháp và chữ ký, nhưng ID người dùng không tồn tại
      // Điều này có thể xảy ra nếu người dùng bị xóa khỏi DB nhưng token vẫn còn.
      return res.status(401).json({ msg: "Người dùng không tồn tại." });
    }
    next(); // Access Token hợp lệ và chưa hết hạn, cho phép yêu cầu tiếp tục
  } catch (err) {
    // Xử lý các loại lỗi JWT khác nhau
    if (err.name === "TokenExpiredError") {
      // TRƯỜNG HỢP NÀY MỚI KÍCH HOẠT LÀM MỚI TOKEN Ở FRONTEND
      return res.status(401).json({ msg: "AccessTokenExpired" }); // Gửi mã lỗi cụ thể
    } else if (err.name === "JsonWebTokenError") {
      // TRƯỜNG HỢP NÀY LÀ TOKEN KHÔNG HỢP LỆ (sai chữ ký, sai cấu trúc, v.v.)
      // Đây là trường hợp hacker gửi token bừa bãi. PHẢI TỪ CHỐI NGAY LẬP TỨC.
      console.error("Lỗi Access Token không hợp lệ:", err.message);
      return res
        .status(401)
        .json({ msg: "Access Token không hợp lệ. Vui lòng đăng nhập lại." });
    } else {
      // Bất kỳ lỗi nào khác
      console.error("Lỗi xác thực Access Token không xác định:", err.message);
      return res.status(500).json({ msg: "Lỗi xác thực máy chủ." });
    }
  }
};

module.exports = verifyToken;
