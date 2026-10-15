const AuditLog = require('../models/AuditLog');

const logAudit = (action, resource) => {
  return async (req, res, next) => {
    // Continue the request and log after response
    res.on('finish', async () => {
      try {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          await AuditLog.create({
            userId: req.user ? req.user._id : 'anonymous',
            userName: req.user ? req.user.name : 'System/Anonymous',
            role: req.user ? req.user.role : 'public',
            action,
            resource,
            ipAddress: req.ip || req.connection.remoteAddress || '127.0.0.1',
            details: {
              method: req.method,
              url: req.originalUrl,
              bodyKeys: req.body ? Object.keys(req.body) : []
            }
          });
        }
      } catch (err) {
        console.error('[Audit Log Error]', err.message);
      }
    });

    next();
  };
};

module.exports = { logAudit };
