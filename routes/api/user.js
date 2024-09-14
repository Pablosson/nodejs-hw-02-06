const express = require("express");
const { User } = require("../../models/user");
const bcrypt = require("bcrypt");
require("dotenv").config();
const secret = process.env.SECRET;
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const router = express.Router();
const { auth } = require("../../middleware/auth");
const gravatar = require("gravatar");
const { upload } = require("../../middleware/upload");
const path = require("path");
const fs = require("fs/promises");
const jimp = require("jimp");

const userSchema = Joi.object({
  password: Joi.string().required(),
  email: Joi.string().required(),
  subscription: Joi.string(),
  token: Joi.string(),
  avatarURL: Joi.string(),
});

router.post("/signup", async (req, res, next) => {
  const validators = userSchema.validate(req.body);
  if (validators.error?.message) {
    return res.status(400).json({ message: validators.error.message });
  }
  const { email, password, subscription } = req.body;
  const user = await User.findOne({ email });
  if (user) {
    return res.status(409).json({
      message: "Email is already in use",
    });
  }
  const avatarURL = gravatar.url(email, { s: "250", d: "retro" });
  try {
    const hashPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      email,
      subscription,
      password: hashPassword,
      avatarURL,
    });
    res.status(201).json({
      message: "Registration successful",
      user: {
        email: newUser.email,
        subscription: newUser.subscription,
        avatarURL,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  const validators = userSchema.validate(req.body);
  if (validators.error?.message) {
    return res.status(400).json({ message: validators.error.message });
  }

  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(401).json({
      message: "Incorrect login or password",
    });
  }

  const passwordCompare = await bcrypt.compare(password, user.password);

  if (!passwordCompare) {
    return res.status(401).json({
      message: "Incorrect login or password",
    });
  }

  try {
    const payload = {
      id: user.id,
      email: user.email,
    };

    const token = jwt.sign(payload, secret, { expiresIn: "1h" });
    await User.findByIdAndUpdate(user._id, { token });

    res.status(200).json({
      token,
      user: {
        email: user.email,
        subscription: user.subscription,
        avatarURL: user.avatarURL,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.patch(
  "/avatars",
  auth,
  upload.single("avatar"),
  async (req, res, next) => {
    const avatarsDir = path.join(process.cwd(), "public", "avatars");
    const { path: temporaryName, originalname } = req.file;
    const { id } = req.user;
    const avatarName = `${id}_${originalname}`;

    try {
      const newAvatar = path.join(avatarsDir, avatarName);
      await fs.rename(temporaryName, newAvatar);

      const image = await jimp.read(newAvatar);
      await image.cover(250, 250).writeAsync(newAvatar);

      const avatarURL = `/avatars/${avatarName}`;

      await User.findByIdAndUpdate(id, { avatarURL }, { new: true });

      res.status(200).json({
        avatarURL,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.patch("/:id", auth, async (req, res, next) => {
  const { id } = req.params;
  const { subscription } = req.body;
  try {
    const user = await User.findByIdAndUpdate(
      id,
      { subscription },
      { new: true }
    );
    res.json(user);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
