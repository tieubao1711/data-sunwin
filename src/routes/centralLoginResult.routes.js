const express = require('express');
const router = express.Router();

const controller = require('../controllers/centralLoginResult.controller');

router.post('/', controller.upsert);
router.get('/', controller.getAll);

module.exports = router;