const router = require('express').Router();
const articleVerificationPanel = require("./articleVerificationPanel")
router.use('/articleverification',articleVerificationPanel);
module.exports = router