const express = require('express');
const RuleSet = require('../models/RuleSet');

const router = express.Router();

router.get('/latest', async (req, res, next) => {
  try {
    const latest = await RuleSet.findOne({ status: 'published' }).sort({ version: -1 }).lean();
    if (!latest) return res.status(404).json({ message: 'No published rule set' });
    res.json(latest);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
