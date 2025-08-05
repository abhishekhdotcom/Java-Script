import { getUserByEmail, verifyToken } from "../services/auth.services.js";

// Verify JWT Token
export default async (req, res, next) => {
  // Check if token exists in cookies
  const token = req.cookies.accessToken;

  if (!token) {
    return res.status(401).redirect("/api/v1/auth/login");
  }

  try {
    // Verify JWT token
    const decodedToken = verifyToken(token);

    // Fetch user by email from decoded token
    const user = await getUserByEmail(decodedToken.email);

    // Check if user exists
    if (!user) {
      res.clearCookie("accessToken"); // Clear invalid token from cookies
      return res.status(401).redirect("/api/v1/auth/login");
    }
    console.log(user);
    req.user = user; // Attach user data to req
    return next(); // Proceed to the next middleware/route
  } catch (error) {
    // Handle specific JWT errors
    if (error.name === "TokenExpiredError") {
      console.error("Token expired:", error.message);
      res.clearCookie("accessToken"); // Clear expired token
      return res.status(401).redirect("/api/v1/auth/login");
    } else if (error.name === "JsonWebTokenError") {
      console.error("Invalid token:", error.message);
      res.clearCookie("accessToken"); // Clear invalid token
      return res.status(401).redirect("/api/v1/auth/login");
    } else {
      console.error("Authentication error:", error.message); // Log for debugging
      return res.status(401).redirect("/api/v1/auth/login");
    }
  }
};
