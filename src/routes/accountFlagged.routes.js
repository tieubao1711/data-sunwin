const express = require('express');
const router = express.Router();

const controller = require('../controllers/accountFlagged.controller');

router.post('/', controller.upsert);
// router.get('/', controller.getAll);
// router.get('/:username', controller.getByUsername);

module.exports = router;