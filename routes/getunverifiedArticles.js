const router = require('express').Router();
let {getUnverifiedArticles } = require("../controllers/unverifiedArticleController")
router.get('',getUnverifiedArticles);
module.exports = router