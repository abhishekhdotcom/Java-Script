import {
  getUserByEmail,
  verifyAccessToken,
  verifyRefreshToken,
  generateAccessToken,
} from "../services/auth.services.js";

const handleUnauthorized = (res) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  return res.status(401).redirect("/api/v1/auth/login");
};

export default async (req, res, next) => {
  const accessToken = req.cookies.accessToken;
  const refreshToken = req.cookies.refreshToken;

  // Not Found Access & Refresh Token
  if (!accessToken && !refreshToken) {
    return handleUnauthorized(res);
  }

  try {
    // Try verifying access token
    const decoded = verifyAccessToken(accessToken);
    const user = await getUserByEmail(decoded.email);

    // If Not User Found in DB
    if (!user) return handleUnauthorized(res);

    req.user = user; // Set User Data in req.user
    return next();
  } catch (error) {
    // If accessToken expired and refreshToken  exists
    if (error.name === "TokenExpiredError" && refreshToken) {
      try {
        // Verify refresh token
        const decodedRefresh = verifyRefreshToken(refreshToken);
        const user = await getUserByEmail(decodedRefresh.email);

        // If Not User Found in DB
        if (!user) return handleUnauthorized(res);

        // Create a new session
        const newSession = await createSession(user.id, {
          ip: req.clientIp, // works with request-ip middleware
          userAgent: req.headers["user-agent"],
        });

        // New JWT payload
        const payload = {
          id: user.id,
          name: user.name,
          email: user.email,
          sessionId: newSession.sessionId,
        };

        // Generate new access token
        const newAccessToken = generateAccessToken(payload);

        // Send new token in cookies
        res.cookie("accessToken", newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
        });

        req.user = user; // Set User Data in req.user
        return next();
      } catch (refreshError) {
        return handleUnauthorized(res);
      }
    }

    return handleUnauthorized(res);
  }
};
