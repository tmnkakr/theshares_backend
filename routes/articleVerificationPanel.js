const router = require('express').Router();
const {isAuthorizeForAvPanel} = require('../middlewares/articleVerificationPanelMiddleware')
let { signIn, getUnverfiedArticles,getUnverfiedArticledata,resendArticleToContributor, discardArticleOfContributor , publishArticle} = require("../controllers/articleVerificationPanelController")
router.post('/signin',signIn);
router.get('/getunverifiedarticles',isAuthorizeForAvPanel, getUnverfiedArticles)
router.post('/articledata',isAuthorizeForAvPanel, getUnverfiedArticledata)
router.post('/publisharticle',isAuthorizeForAvPanel, publishArticle),
router.post('/resendarticle',isAuthorizeForAvPanel, resendArticleToContributor),
router.post('/discardarticle',isAuthorizeForAvPanel,discardArticleOfContributor)
module.exports = router
