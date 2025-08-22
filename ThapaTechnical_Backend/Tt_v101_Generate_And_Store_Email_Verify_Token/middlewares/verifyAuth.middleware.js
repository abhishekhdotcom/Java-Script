import {
  getUserById,
  verifyAccessToken,
  verifyRefreshToken,
  findSessionById,
  deleteSessionById,
  authenticateUser,
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

        // Create Session, AccessToke, RefreshToken & Set Cookies
        await authenticateUser({ user, req, res });
        
        req.user = user; // Set User Data in req.user
        return next();
      } catch (refreshError) {
        return handleUnauthorized(res);
      }
    }
    return handleUnauthorized(res);
  }
};
