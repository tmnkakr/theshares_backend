const router = require('express').Router();
let userController = require("../controllers/userController")
function getRegistrationPage(req,res){
        return res.status(400).render("register");
}
router.get('',getRegistrationPage);
router.post('',userController.addUser);


module.exports = router