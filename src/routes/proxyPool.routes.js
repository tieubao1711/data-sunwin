const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/proxyPool.controller');

router.get('/', ctrl.getPools);
router.post('/', ctrl.createPool);
router.patch('/:poolId', ctrl.updatePool);
router.delete('/:poolId', ctrl.deletePool);
router.get('/:poolId/proxies', ctrl.getProxies);
router.post('/:poolId/import', express.text({ type: 'text/*' }), ctrl.importProxies);
router.get('/:poolId/active-proxies', ctrl.getActiveProxies);
router.delete('/:poolId/proxies/:proxyId', ctrl.deleteProxy);
router.patch('/:poolId/proxies/:proxyId', ctrl.updateProxy);

module.exports = router;
