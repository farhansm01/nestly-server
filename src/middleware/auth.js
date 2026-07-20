const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");
const { checkInternalSecret } = require("./internalSecret");

const betterAuthUrl = process.env.BETTER_AUTH_URL || "http://localhost:5000";
let JWKS = null;

try {
  JWKS = createRemoteJWKSet(new URL(`${betterAuthUrl}/api/auth/jwks`));
} catch (e) {
  // JWKS endpoint fallback
}

/**
 * Authentication Middleware
 * Checks for:
 * 1. INTERNAL_API_SECRET bypass header
 * 2. Bearer JWT or Session authorization
 */
const requireAuth = async (req, res, next) => {
  // 1. Check internal secret bypass
  if (checkInternalSecret(req)) {
    const internalUserId = req.headers["x-user-id"] || req.headers["user-id"] || "system_internal";
    const internalRole = req.headers["x-user-role"] || "admin";
    const userStatus = req.headers["x-user-status"];
    if (userStatus === "restricted") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Your account has been restricted by an administrator.",
      });
    }

    req.user = {
      id: internalUserId,
      _id: internalUserId,
      email: req.headers["x-user-email"] || "system@nestly.internal",
      name: req.headers["x-user-name"] || "Internal Service",
      role: internalRole,
      isInternal: true,
    };
    return next();
  }

  // 2. Extract authorization header or cookies
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    // Check if session token cookie is provided
    const cookieHeader = req.headers.cookie;
    if (cookieHeader) {
      // Pass-through request with session cookies to controllers to verify with BetterAuth
      req.user = { authenticatedViaCookie: true };
      return next();
    }
    return res.status(401).json({ success: false, message: "Unauthorized: Missing authentication token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    if (JWKS) {
      const { payload } = await jwtVerify(token, JWKS);
      req.user = {
        id: payload.sub || payload.id,
        _id: payload.sub || payload.id,
        email: payload.email,
        name: payload.name,
        role: payload.role || "user",
      };
      return next();
    }
    // Basic payload decode fallback if JWKS not accessible in dev
    const base64Payload = token.split(".")[1];
    const payload = JSON.parse(Buffer.from(base64Payload, "base64").toString("utf-8"));
    req.user = {
      id: payload.sub || payload.id,
      _id: payload.sub || payload.id,
      email: payload.email,
      name: payload.name,
      role: payload.role || "user",
    };
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Unauthorized: Invalid or expired token" });
  }
};

/**
 * Optional Authentication Middleware
 * Attaches user to req.user if authenticated, but does not block if unauthenticated.
 */
const optionalAuth = async (req, res, next) => {
  if (checkInternalSecret(req)) {
    const internalUserId = req.headers["x-user-id"] || req.headers["user-id"] || "system_internal";
    req.user = {
      id: internalUserId,
      _id: internalUserId,
      email: req.headers["x-user-email"] || "system@nestly.internal",
      name: req.headers["x-user-name"] || "Internal Service",
      role: req.headers["x-user-role"] || "admin",
      isInternal: true,
    };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      if (JWKS) {
        const { payload } = await jwtVerify(token, JWKS);
        req.user = {
          id: payload.sub || payload.id,
          _id: payload.sub || payload.id,
          email: payload.email,
          name: payload.name,
          role: payload.role || "user",
        };
      }
    } catch (e) {
      // Ignored for optional auth
    }
  }
  return next();
};

module.exports = { requireAuth, optionalAuth };
