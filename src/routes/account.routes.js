const router = require('express').Router();
const ctrl = require('../controllers/account.controller');

router.get('/unchecked', ctrl.getUnchecked);
router.post('/', ctrl.create);
router.get('/', ctrl.getAll);

module.exports = router;