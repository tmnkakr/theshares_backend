const router = require("express").Router();
let searchController = require("../controllers/searchController");

router.post("", searchController.findArticle);
module.exports = router;
