const router = require('express').Router();
let { fetchArticle} = require("../controllers/articleController")
router.get('',fetchArticle);
module.exports = router