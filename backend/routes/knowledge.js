const express = require('express');
const router = express.Router();
const {
  getAllKnowledge,
  getKnowledgeById,
  createKnowledge,
  updateKnowledge,
  deleteKnowledge,
  searchKnowledge,
  getCategories
} = require('../controllers/knowledgeController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validate, createKnowledgeRules } = require('../middleware/validators');

router.get('/', authenticateToken, getAllKnowledge);
router.get('/search', authenticateToken, searchKnowledge);
router.get('/categories', authenticateToken, getCategories);
router.get('/:id', authenticateToken, getKnowledgeById);
router.post('/', authenticateToken, authorizeRoles('admin', 'hr'), createKnowledgeRules, validate, createKnowledge);
router.put('/:id', authenticateToken, authorizeRoles('admin', 'hr'), updateKnowledge);
router.delete('/:id', authenticateToken, authorizeRoles('admin'), deleteKnowledge);

module.exports = router;