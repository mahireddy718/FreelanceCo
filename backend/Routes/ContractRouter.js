const express = require('express');
const router = express.Router();
const ensureAuthenticated = require('../Middlewares/Auth');
const {
    proposeContract,
    getContractsByConversation,
    updateContractStatus,
    getMyContracts
} = require('../Controllers/ContractController');

// All routes require authentication
router.post('/', ensureAuthenticated, proposeContract);
router.get('/conversation/:conversationId', ensureAuthenticated, getContractsByConversation);
router.get('/my', ensureAuthenticated, getMyContracts);
router.patch('/:id/status', ensureAuthenticated, updateContractStatus);

module.exports = router;
