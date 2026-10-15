const bcrypt = require('bcryptjs');
const express = require('express');
const User = require('../models/User');
const { accessToken, refreshToken } = require('../utils/tokens');
const validate = require('../utils/validate');

const router = express.Router();
const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role, village: u.village, phone: u.phone });

const rules = (validationRules) => (req, res, next) => {
  req.validationRules = validationRules;
  next();
};

router.post('/register', rules([
  { field: 'name', required: true },
  { field: 'email', required: true, email: true },
  { field: 'password', required: true, min: 8 },
  { field: 'role', in: ['patient', 'health_worker'] }
]), validate, async (req, res, next) => {
  try {
    const { name, email, password, phone = '', village = '', role = 'patient' } = req.body;
    if (await User.exists({ email })) return res.status(409).json({ message: 'Email already registered' });
    const user = await User.create({ name, email, phone, village, role, passwordHash: await User.hashPassword(password) });
    const rt = refreshToken();
    user.refreshTokenHash = await bcrypt.hash(rt, 10);
    await user.save();
    res.status(201).json({ user: publicUser(user), accessToken: accessToken(user), refreshToken: rt });
  } catch (error) {
    next(error);
  }
});

router.post('/login', rules([
  { field: 'email', required: true, email: true },
  { field: 'password', required: true }
]), validate, async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user || !user.isActive || !(await user.checkPassword(req.body.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const rt = refreshToken();
    user.refreshTokenHash = await bcrypt.hash(rt, 10);
    await user.save();
    const token = accessToken(user);
    const pubUser = publicUser(user);
    res.json({
      success: true,
      data: {
        ...pubUser,
        token
      },
      user: pubUser,
      accessToken: token,
      refreshToken: rt
    });
  } catch (error) {
    next(error);
  }
});

router.post('/refresh', rules([{ field: 'refreshToken', required: true }]), validate, async (req, res, next) => {
  try {
    const users = await User.find({ refreshTokenHash: { $ne: '' }, isActive: true });
    const user = await users.reduce(async (foundPromise, candidate) => {
      const found = await foundPromise;
      if (found) return found;
      return (await candidate.checkRefreshToken(req.body.refreshToken)) ? candidate : null;
    }, Promise.resolve(null));
    if (!user) return res.status(401).json({ message: 'Invalid refresh token' });
    res.json({ accessToken: accessToken(user), user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
