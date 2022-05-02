const router = require('express').Router();
let loginController = require("../controllers/loginController")
const getLoginPage = (req, res) => {
    return res.status(400).render("login");
  };
router.get('',getLoginPage);
router.post('',loginController.appLogin);


module.exports = router