import {
  getUserById,
  verifyAccessToken,
  verifyRefreshToken,
  generateAccessToken,
  generateRefreshToken,
  createSession,
  findSessionById,
  deleteSessionById,
} from "../services/auth.services.js";
import {
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY,
} from "../config/constants.js";

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

    // Fetch user By Id
    const user = await getUserById(decoded.id);

    // If Not User Found in DB
    if (!user) {
      return handleUnauthorized(res);
    }

    req.user = user; // Set User Data in req.user
    return next();
  } catch (error) {
    // If accessToken expired and refreshToken  exists
    if (refreshToken) {
      try {
        // Verify refresh token
        const decodedRefresh = verifyRefreshToken(refreshToken);

        // Find current Session by SessionId
        const currentSession = await findSessionById(decodedRefresh.sessionId);

        // If Not Session Found
        if (!currentSession) {
          return handleUnauthorized(res);
        }

        // Fetch user by user Id
        const user = await getUserById(currentSession.userId);

        // If Not User Found in DB
        if (!user) {
          return handleUnauthorized(res);
        }

        // Clean up old session
        await deleteSessionById(decodedRefresh.sessionId);

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

        // Generate new accessToken
        const newAccessToken = generateAccessToken(payload);

        // Generate new refreshToken
        const newRefreshToken = generateRefreshToken(newSession.sessionId);

        // Set AccessToken & RefreshToken In Cookies
        const baseConfig = {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
        };

        res.cookie("accessToken", newAccessToken, {
          ...baseConfig,
          maxAge: ACCESS_TOKEN_EXPIRY,
        });

        res.cookie("refreshToken", newRefreshToken, {
          ...baseConfig,
          maxAge: REFRESH_TOKEN_EXPIRY,
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
