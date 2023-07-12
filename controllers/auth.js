const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const gravatar = require("gravatar");
const path = require("path");
const fs = require("fs/promises");
const Jimp = require("jimp");
const { nanoid } = require("nanoid");

const { User, schemas } = require("../models/user");

const { AppError, ctrlWrapper, sendEmail } = require("../helpers");

dotenv.config();
const { SECRET_KEY, BASE_URL } = process.env;

const avatarsDir = path.join(__dirname, "../", "public", "avatars");

const register = async (req, res) => {
  const { error } = schemas.registerSchema.validate(req.body);
  if (error) {
    throw AppError(400, error.message);
  }
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user) {
    throw AppError(409, "Email in use");
  }

  const hashPassword = await bcrypt.hash(password, 10);
  const avatarURL = gravatar.url(email);
  const verificationToken = nanoid();

  const newUser = await User.create({
    ...req.body,
    password: hashPassword,
    avatarURL,
    verificationToken,
  });

  const verifyEmail = {
    to: email,
    subject: "Verify email",
    html: `<a target="_blank" href='${BASE_URL}/api/auth/verify/${verificationToken}'>Click verify email</a>`,
  };

  await sendEmail(verifyEmail);

  res.status(201).json({
    user: {
      email: newUser.email,
      subscription: newUser.subscription,
    },
  });
};

const verifyEmail = async (req, res) => {
  const { verificationToken } = req.params;
  const user = await User.findOne({ verificationToken });

  if (!user) {
    throw AppError(404, "User not found");
  }
  await User.findByIdAndUpdate(user._id, {
    verify: true,
    verificationToken: "",
  });

  res.status(200).json({ message: "Verification successful" });
};

const resendVerifyEmail = async (req, res) => {
  const { error } = schemas.emailSchema.validate(req.body);
  if (error) {
    throw AppError(400, "missing required field email");
  }
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    throw AppError(404, "User not found");
  }

  if (user.verify) {
    throw AppError(400, "Verification has already been passed");
  }

  const verifyEmail = {
    to: email,
    subject: "Verify email",
    html: `<a target="_blank" href='${BASE_URL}/api/auth/verify/${user.verificationToken}'>Click verify email</a>`,
  };

  await sendEmail(verifyEmail);

  res.status(200).json({ message: "Verification email sent" });
};

const login = async (req, res) => {
  const { error } = schemas.loginSchema.validate(req.body);
  if (error) {
    throw AppError(400, error.message);
  }
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    throw AppError(401, "Email or password is wrong");
  }

  if (!user.verify) {
    throw AppError(401, "Email not verified");
  }

  const passwordCompare = await bcrypt.compare(password, user.password);
  if (!passwordCompare) {
    throw AppError(401, "Email or password is wrong");
  }

  const payload = {
    id: user._id,
  };

  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "23h" });
  await User.findByIdAndUpdate(user._id, { token });

  res.status(200).json({
    token: token,
    user: {
      email: user.email,
      subscription: user.subscription,
    },
  });
};

const getCurrent = async (req, res) => {
  const { email, subscription } = req.user;

  res.status(200).json({
    email,
    subscription,
  });
};

const logout = async (req, res) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, { token: "" });

  res.status(204).json({
    message: "No Content",
  });
};

const updateSubscription = async (req, res) => {
  const { error } = schemas.updateSubscriptionSchema.validate(req.body);
  if (error) {
    throw AppError(400, "missing field subscription or set incorrectly");
  }
  const { _id, email } = req.user;
  const { subscription } = req.body;

  const result = await User.findOneAndUpdate(
    _id,
    { subscription },
    { new: true }
  );
  if (!result) {
    throw AppError(404, "Not found");
  }
  res.status(200).json({ email, subscription });
};

const updateAvatar = async (req, res) => {
  const { _id } = req.user;
  const { path: tempUpload, originalname } = req.file;
  const filename = `${_id}_${originalname}`;
  const resultUpload = path.join(avatarsDir, filename);

  await Jimp.read(tempUpload).then((avatar) => {
    return avatar.resize(250, 250).write(tempUpload);
  });
  await fs.rename(tempUpload, resultUpload);
  const avatarURL = path.join("avatars", filename);
  await User.findByIdAndUpdate(_id, { avatarURL });

  res.status(200).json({ avatarURL });
};

module.exports = {
  register: ctrlWrapper(register),
  verifyEmail: ctrlWrapper(verifyEmail),
  resendVerifyEmail: ctrlWrapper(resendVerifyEmail),
  login: ctrlWrapper(login),
  getCurrent: ctrlWrapper(getCurrent),
  logout: ctrlWrapper(logout),
  updateSubscription: ctrlWrapper(updateSubscription),
  updateAvatar: ctrlWrapper(updateAvatar),
};
