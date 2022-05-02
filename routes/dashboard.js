const router = require('express').Router();
// let loginController = require("../controllers/loginController")
const getDashboardPage = (req, res) => {
    return res.status(400).render("dashboard");
  };
router.get('',getDashboardPage);
module.exports = router