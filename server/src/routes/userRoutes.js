const express = require('express');
const router = express.Router();
const {
  getUsers,
  updateUser,
  getAuditLogs,
  getConflicts,
  resolveConflict
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { logAudit } = require('../middleware/auditMiddleware');

router.use(protect);

router.get('/', authorize('admin'), getUsers);
router.put('/:id', authorize('admin'), logAudit('USER_UPDATE', 'User'), updateUser);
router.get('/audit-logs', authorize('admin'), getAuditLogs);
router.get('/conflicts', authorize('admin', 'doctor'), getConflicts);
router.post('/resolve-conflict', authorize('admin', 'doctor'), logAudit('RESOLVE_CONFLICT', 'SyncEngine'), resolveConflict);

module.exports = router;
