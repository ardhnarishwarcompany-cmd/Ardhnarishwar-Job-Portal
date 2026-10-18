import jwt from "jsonwebtoken";
import { connection } from "../models/dbModels.js";

export const getTokenFromReq = (req) => {
  const origin = req.headers.origin || "";
  const referer = req.headers.referer || "";
  const isFromAdminPortal = origin.includes("5174") || referer.includes("5174") || req.baseUrl?.startsWith("/api/admin") || req.originalUrl?.startsWith("/api/admin");

  if (isFromAdminPortal && req.cookies?.admin_token) {
    return req.cookies.admin_token;
  }
  if (!isFromAdminPortal && req.cookies?.token) {
    return req.cookies.token;
  }
  return req.cookies?.token || req.cookies?.admin_token || req.headers.authorization?.split(" ")[1] || null;
};

const authenticateToken = async (req, res, next) => {
  try {
    const token = getTokenFromReq(req);
    if (!token) {
      return res
        .status(401)
        .json({ message: "No token provided", success: false });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return (
        res.status(401).json({ message: "Invalid token" }), (success = false)
      );
    }

    // Real-time block enforcement: even an already-issued token stops working
    // the moment an admin blocks this account, not just on the next login.
    const [rows] = await connection
      .promise()
      .query("SELECT isBlocked FROM users WHERE id = ? LIMIT 1", [decoded.userId]);
    if (rows.length === 0) {
      return res.status(401).json({ message: "Account not found", success: false });
    }
    if (rows[0].isBlocked) {
      res.clearCookie("token");
      res.clearCookie("admin_token");
      return res.status(403).json({
        message: "Your account has been blocked by the admin.",
        success: false,
      });
    }

    req.id = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  } 
};

export const optionalAuthenticateToken = async (req, res, next) => {
  try {
    const token = getTokenFromReq(req);
    if (!token) {
      req.id = null;
      return next();
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded && decoded.userId) {
      const [rows] = await connection
        .promise()
        .query("SELECT isBlocked FROM users WHERE id = ? LIMIT 1", [decoded.userId]);
      if (rows.length > 0 && !rows[0].isBlocked) {
        req.id = decoded.userId;
      } else {
        req.id = null;
      }
    } else {
      req.id = null;
    }
  } catch (error) {
    req.id = null;
  }
  next();
};

export default authenticateToken;