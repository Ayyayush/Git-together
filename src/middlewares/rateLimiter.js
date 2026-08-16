const rateLimit = require("express-rate-limit");

/*
 * ============================
 * General API Rate Limiter
 * ============================
 * Limits repeated requests from the same IP.
 * Helps protect APIs from abuse and accidental
 * excessive requests.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too Many Requests",
    message: "Too many requests from this IP. Please try again later.",
  },
});

/*
 * ============================
 * AI API Rate Limiter
 * ============================
 * Stricter limit because AI requests can
 * consume external API resources.
 */
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too Many Requests",
    message: "Too many AI requests. Please try again later.",
  },
});

module.exports = {
  apiLimiter,
  aiLimiter,
};