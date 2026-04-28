const express = require('express');
const router = express.Router();

const controller = require('../controllers/centralRun.controller');

router.get('/latest', controller.getLatestByAccount);
router.post('/', controller.upsert);
router.get('/', controller.getAll);
router.delete('/:runKey', controller.remove);

module.exports = router;