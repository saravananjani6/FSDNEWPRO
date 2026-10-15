const express = require('express');
const bcrypt = require('bcryptjs');
const Clinic = require('../models/Clinic');
const RuleSet = require('../models/RuleSet');
const TriageRecord = require('../models/TriageRecord');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const validate = require('../utils/validate');

const router = express.Router();
router.use(protect, requireRole('admin'));
const rules = (validationRules) => (req, res, next) => {
  req.validationRules = validationRules;
  next();
};

router.get('/rules', async (req, res, next) => {
  try {
    const rules = await RuleSet.find().sort({ version: -1 }).limit(20).lean();
    res.json(rules);
  } catch (error) {
    next(error);
  }
});

router.post('/rules', rules([{ field: 'questions', required: true, array: true }, { field: 'rules', required: true, array: true }]), validate, async (req, res, next) => {
  try {
    const latest = await RuleSet.findOne().sort({ version: -1 });
    const ruleSet = await RuleSet.create({
      version: latest ? latest.version + 1 : 1,
      status: 'draft',
      questions: req.body.questions,
      rules: req.body.rules,
      languages: req.body.languages || {},
      symptomList: req.body.symptomList || [],
      createdBy: req.user._id
    });
    res.status(201).json(ruleSet);
  } catch (error) {
    next(error);
  }
});

router.put('/rules/:id', async (req, res, next) => {
  try {
    const updated = await RuleSet.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Rule set not found' });
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.post('/rules/:id/publish', async (req, res, next) => {
  try {
    const source = await RuleSet.findById(req.params.id);
    if (!source) return res.status(404).json({ message: 'Rule set not found' });
    const latest = await RuleSet.findOne().sort({ version: -1 });
    const published = await RuleSet.create({
      version: latest ? latest.version + 1 : 1,
      status: 'published',
      questions: source.questions,
      rules: source.rules,
      languages: source.languages,
      symptomList: source.symptomList,
      publishedAt: new Date(),
      createdBy: req.user._id
    });
    res.status(201).json(published);
  } catch (error) {
    next(error);
  }
});

router.delete('/rules/:id', async (req, res, next) => {
  try {
    await RuleSet.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.get('/clinics', async (req, res, next) => {
  try {
    res.json(await Clinic.find().sort({ village: 1, name: 1 }).lean());
  } catch (error) {
    next(error);
  }
});

router.post('/clinics', rules([{ field: 'name', required: true }, { field: 'village', required: true }, { field: 'phone', required: true }]), validate, async (req, res, next) => {
  try {
    res.status(201).json(await Clinic.create({ ...req.body, updatedAt: new Date() }));
  } catch (error) {
    next(error);
  }
});

router.put('/clinics/:id', async (req, res, next) => {
  try {
    const clinic = await Clinic.findByIdAndUpdate(req.params.id, { ...req.body, updatedAt: new Date() }, { new: true });
    if (!clinic) return res.status(404).json({ message: 'Clinic not found' });
    res.json(clinic);
  } catch (error) {
    next(error);
  }
});

router.delete('/clinics/:id', async (req, res, next) => {
  try {
    await Clinic.findByIdAndUpdate(req.params.id, { isActive: false, updatedAt: new Date() });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.get('/health-workers', async (req, res, next) => {
  try {
    res.json(await User.find({ role: 'health_worker' }).select('-passwordHash -refreshTokenHash').lean());
  } catch (error) {
    next(error);
  }
});

router.post('/health-workers', rules([
  { field: 'name', required: true },
  { field: 'email', required: true, email: true },
  { field: 'password', required: true, min: 8 }
]), validate, async (req, res, next) => {
  try {
    if (await User.exists({ email: req.body.email })) return res.status(409).json({ message: 'Email already exists' });
    const user = await User.create({
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone || '',
      village: req.body.village || '',
      role: 'health_worker',
      passwordHash: await User.hashPassword(req.body.password)
    });
    res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role, village: user.village });
  } catch (error) {
    next(error);
  }
});

router.put('/health-workers/:id', async (req, res, next) => {
  try {
    const update = { ...req.body };
    delete update.password;
    if (req.body.password) update.passwordHash = await bcrypt.hash(req.body.password, 10);
    const user = await User.findOneAndUpdate({ _id: req.params.id, role: 'health_worker' }, update, { new: true }).select('-passwordHash -refreshTokenHash');
    if (!user) return res.status(404).json({ message: 'Health worker not found' });
    res.json(user);
  } catch (error) {
    next(error);
  }
});

router.delete('/health-workers/:id', async (req, res, next) => {
  try {
    await User.findOneAndUpdate({ _id: req.params.id, role: 'health_worker' }, { isActive: false });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.get('/stats', async (req, res, next) => {
  try {
    const colorCounts = await TriageRecord.aggregate([{ $group: { _id: '$result.color', count: { $sum: 1 } } }]);
    const usageByVillage = await TriageRecord.aggregate([{ $group: { _id: '$village', count: { $sum: 1 } } }, { $sort: { count: -1 } }]);
    const commonSymptoms = await TriageRecord.aggregate([{ $unwind: '$symptoms' }, { $group: { _id: '$symptoms', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 12 }]);
    res.json({ colorCounts, usageByVillage, commonSymptoms });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
