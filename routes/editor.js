const editorMiddlewares = require("../middlewares/editorMiddleware");
const router = require("express").Router();
let editorController = require("../controllers/editorController");
const getEditor = (req, res) => {
  return res.render("editor");
};
router.get("", getEditor);
router.post(
  "/uploadMedia",
  [
    editorMiddlewares.mediaProp,
    editorController.uploadMedia,
  ],
  editorController.uploadMediaVerification
);

router.post("/uploadArticle", editorController.uploadArticle);
module.exports = router;
