const User = require("../models/User");
const Role = require("../models/Role");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/generateTokens");
const { sendEmail } = require("../services/emailService");

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (await User.findOne({ email })) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const role = await Role.findOne({ name: "user" });

    if (!role) {
      return res.status(500).json({ message: "Default role not found" });
    }

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: role._id,
      isEmailVerified: false,
      isOTPVerified: false,
    });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");

    user.emailOTP = hashedOTP;
    user.emailOTPExpires = Date.now() + 2 * 60 * 1000;
    await user.save();

    res.status(201).json({
      message: "OTP sent successfully",
      email: user.email,
    });

    try {
      const buildEmailTemplate = require("../utils/emailTemplateBuilder");

      const styledOTP = otp
        .split("")
        .map(
          (digit) => `
  <td style="
    width: 40px;
    height: 50px;
    background: #f5f2ec;
    border: 1px solid #dedad2;
    border-bottom: 3px solid #181816;
    border-radius: 5px;
    text-align: center;
    vertical-align: middle;
    font-family: 'Courier New', Courier, monospace;
    font-size: 22px;
    font-weight: 700;
    color: #181816;
    padding: 0;
  ">${digit}</td>
  <td style="width:6px; font-size:0; line-height:0;">&nbsp;</td>
`,
        )
        .join("");

      const html = buildEmailTemplate({
        template: "verifyotp.html",
        title: "Verify Your Email",
        subtitle: "THANKS FOR SIGNING UP!",
        heading: "Verify Your E-Mail Address",
        replacements: {
          USERNAME: user.username,
          OTP: styledOTP,
        },
      });

      await sendEmail({
        to: email,
        subject: "Verify your CineVerse Account",
        html,
      });
    } catch (emailError) {
      console.error("Email failed but user created:", emailError.message);
    }
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ message: "Registration failed" });
  }
};

exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: "User not found" });

    if (user.isEmailVerified)
      return res.status(400).json({ message: "Already verified" });

    if (user.emailOTPExpires && user.emailOTPExpires > Date.now()) {
      const remainingMs = user.emailOTPExpires - Date.now();
      const remainingSeconds = Math.ceil(remainingMs / 1000);

      return res.status(429).json({
        message: `Please wait ${remainingSeconds} seconds before requesting a new OTP.`,
        remainingSeconds,
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");

    user.emailOTP = hashedOTP;
    user.emailOTPExpires = Date.now() + 2 * 60 * 1000;

    await user.save();

    const buildEmailTemplate = require("../utils/emailTemplateBuilder");

    const styledOTP = otp
      .split("")
      .map(
        (digit) => `
  <td style="
    width: 40px;
    height: 50px;
    background: #f5f2ec;
    border: 1px solid #dedad2;
    border-bottom: 3px solid #181816;
    border-radius: 5px;
    text-align: center;
    vertical-align: middle;
    font-family: 'Courier New', Courier, monospace;
    font-size: 22px;
    font-weight: 700;
    color: #181816;
    padding: 0;
  ">${digit}</td>
  <td style="width:6px; font-size:0; line-height:0;">&nbsp;</td>
`,
      )
      .join("");

    const html = buildEmailTemplate({
      template: "verifyotp.html",
      title: "Verify Your Email",
      subtitle: "RESEND OTP",
      heading: "Your New OTP",
      replacements: {
        USERNAME: user.username,
        OTP: styledOTP,
      },
    });

    await sendEmail({
      to: email,
      subject: "Resend OTP - CineVerse",
      html,
    });

    res.json({ message: "OTP resent successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Resend OTP failed" });
  }
};

exports.verifyEmailOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: "User not found" });

    if (user.isEmailVerified)
      return res.status(400).json({ message: "Email already verified" });

    if (!user.emailOTP || !user.emailOTPExpires)
      return res.status(400).json({ message: "No OTP found" });

    if (user.emailOTPExpires < Date.now())
      return res.status(400).json({ message: "OTP expired" });

    const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");

    if (hashedOTP !== user.emailOTP)
      return res.status(400).json({ message: "Invalid OTP" });

    user.isOTPVerified = true;
    user.isEmailVerified = true;
    user.emailOTP = null;
    user.emailOTPExpires = null;

    await user.save();

    res.json({ message: "Email verified successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Verification failed" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).populate("role");

    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    if (!user.isEmailVerified) {
      return res.status(403).json({
        message: "Please verify your email using OTP before logging in",
        requiresOTP: true,
      });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      accessToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role?.name,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Login failed" });
  }
};
