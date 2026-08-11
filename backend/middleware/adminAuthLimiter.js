const rateLimit = require("express-rate-limit");

// IP-based throttle for the password step. This is on top of the
// per-account lockout in adminAuthController — the two cover different
// attack shapes: this stops one IP hammering many accounts, the account
// lockout stops distributed attempts against one account.
exports.loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts. Please try again in 15 minutes." },
});

// Tighter limit for OTP verification — codes are 6 digits, so guessing
// needs to be made expensive even within a single 5-minute temp-token window.
exports.otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please request a new code." },
});

// Separate, stricter limit just for resend so it can't be used to spam
// the admin's inbox or sidestep the loginLimiter above.
exports.resendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many code requests. Please try again later." },
});

// Change-password is already behind auth, but still throttle it — caps
// how many current-password guesses a stolen access token can burn through.
exports.changePasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again in 15 minutes." },
});

// Forgot-password request/resend — kept tight since this endpoint accepts
// an arbitrary email and always replies with the same generic message,
// which makes it an easy target for inbox-flooding if left unthrottled.
exports.forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please try again later." },
});

// Verifying the reset OTP / submitting the final new password.
exports.resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again later." },
});