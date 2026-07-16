const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");
const Role = require("../models/Role");
const sendWelcomeEmail = require("../utils/sendWelcomeEmail");

const makeUniqueUsername = async (base) => {
  let candidate = base;
  let i = 0;
  while (await User.findOne({ username: candidate })) {
    i += 1;
    candidate = `${base}${i}`;
  }
  return candidate;
};

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error("No email returned from Google"), null);

        let user = await User.findOne({ email });

        if (user) {
          if (!user.googleId) {
            user.googleId = profile.id;
            user.isEmailVerified = true;
            user.isOTPVerified = true;
            await user.save();
          }
          return done(null, user);
        }

        const role = await Role.findOne({ name: "user" });
        if (!role) return done(new Error("Default role not found"), null);

        const baseUsername = (profile.displayName || email.split("@")[0]).replace(/\s+/g, "");
        const username = await makeUniqueUsername(baseUsername);

        user = await User.create({
          username,
          email,
          googleId: profile.id,
          authProvider: "google",
          role: role._id,
          isEmailVerified: true,
          isOTPVerified: true,
        });

        // Fire-and-forget — a welcome email failing must never block login
        sendWelcomeEmail({ toEmail: email, toName: username }).catch((err) =>
          console.error("sendWelcomeEmail failed (non-fatal):", err.message)
        );

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;