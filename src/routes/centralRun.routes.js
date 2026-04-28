const express = require('express');
const router = express.Router();

const controller = require('../controllers/centralRun.controller');

router.post('/', controller.upsert);
router.get('/', controller.getAll);
router.delete('/:runKey', controller.remove);

module.exports = router;