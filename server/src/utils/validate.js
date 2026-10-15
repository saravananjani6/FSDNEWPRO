function validate(req, res, next) {
  const errors = [];
  for (const rule of req.validationRules || []) {
    const value = req.body[rule.field];
    if (rule.required && (value === undefined || value === null || value === '')) errors.push({ path: rule.field, msg: 'Required' });
    if (rule.email && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors.push({ path: rule.field, msg: 'Invalid email' });
    if (rule.min && value && String(value).length < rule.min) errors.push({ path: rule.field, msg: `Minimum length ${rule.min}` });
    if (rule.array && value !== undefined && !Array.isArray(value)) errors.push({ path: rule.field, msg: 'Must be an array' });
    if (rule.in && value !== undefined && !rule.in.includes(value)) errors.push({ path: rule.field, msg: 'Invalid value' });
  }
  if (errors.length) return res.status(400).json({ message: 'Validation failed', errors });
  next();
}

module.exports = validate;
