const router = require('express').Router();
const ctrl = require('../controllers/account.controller');

router.post('/', ctrl.create);
router.get('/', ctrl.getAll);

module.exports = router;