const {
  generateResponse,
  writeErrToFile,
  resultObject,
} = require("../utils/commonUtils");
const {
  commonPathForPublishedArticles,
  commonPathForUnverifiedArticles,
} = require("../utils/appConstants");
const { firebase, firebaseConfig } = require("../utils/firebaseStuff");
const {
  getStorage,
  ref,
  listAll,
  deleteObject,
  getDownloadURL,
} = require("firebase/storage");
firebase.initializeApp(firebaseConfig);
const storage = getStorage();

/**
 * this function takes articleId and articleStatus as input and returns all files (like media files related to it)
 * @param {*} req
 * @param {*} res
 * @param {number} articleStatus 0 means article is underverification and 1 means article is published
 * @param {number} articleId unique id for article
 */
const fetchArticle = async (req, res) => {
  
  const articleStatus = parseInt(req.body.articleStatus)
  const articleId = parseInt(req.query.articleId)
  console.log(articleId,articleStatus)
  let pathOfDirectory;
  if (articleStatus === 0) pathOfDirectory = "editor/underVerification";
  else pathOfDirectory = commonPathForPublishedArticles;
  try {
    // Create a reference under which you want to list
    const listRef = ref(storage, pathOfDirectory);
    // Find all the prefixes and items.
    let isDataFetchedFully = true;
    let files = {};
    listAll(listRef)
      .then(async (result) => {
        let element;
        for (let i = 0; i < result.items.length; i++) {
          element = result.items[i];
          await getDownloadURL(ref(storage, element._location.path_))
            .then((url) => {
              files[element._location.path_] = url;
            })
            .catch(async (error) => {
              // Handle any errors
              isDataFetchedFully = false;
              console.log(error);
              await writeErrToFile({
                when: `couldn't able to fetch article file named ${element._location.path_}`,
                where: "fetchArticle()",
                error: `${error.message} here stack trace was ${error.stack}`,
              });
            });
        }

        if (files === {}) {
          // means files is empty
          res.send(
            resultObject(1, `Success: article data donot exist`, {
              files,
            })
          );
        } else {
          res.send(
            resultObject(1, `Success: successfully fetched data of article`, {
              files,
              isDataFetchedFully,
            })
          );
        }
      })
      .catch(async (error) => {
        // Uh-oh, an error occurred!
        console.log(error);
        writeErrToFile({
          when: `couldn't able to fetch article files`,
          where: "fetchArticle()",
          error: `${error.message} here stack trace was ${error.stack}`,
        });
        res.send(resultObject(0, `Failed: couldn't able to fetch article`, {}));
      });
  } catch (error) {
    console.log(error);
    await writeErrToFile({
      when: " while getting article",
      where: "getArticlePage()",
      error: `${error.message} here stack trace was ${error.stack}`,
    });
    res.send(resultObject(0, `Failed: couldn't able to fetch article`, {}));
  }
};
module.exports = {
  fetchArticle,
};
