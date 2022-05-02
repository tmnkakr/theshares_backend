const { checkIfAdminExist } = require("../utils/admins");
const {
  TurnUnverifiedArticleToVerifiedArticle,
} = require("../utils/underVerificationArticle");
const {
  writeErrToFileForArticleVerificationPanel,
  resultObject,
} = require("../utils/commonUtils");
const {
  getAllunverifiedArticles,
  resendArticle,
  discardArticle,
} = require("../utils/underVerificationArticle");
const {
  getUnverifiedArticle,
} = require("../utils/collectUnverifiedArticleDetails");
const { getDataFromSessionId } = require("../utils/session");
const {
  sortContentsInsideMainFile,
  parseData,
} = require("../utils/articleParsing");
const { addCommentInArticle } = require("../utils/firestoreDatabase");

const signIn = async (req, res) => {
  return new Promise((resolve,reject)=>{
    const { userId, password, securitykey } = req.body;
  try {
    resolve(res.send(
      resultObject(
        0,
        `Failed: something went wrong try again after sometime.`,
        {}
      )
    ))
    if (req.cookies.avPSess) {
      // means coookie was available at user's side
      const sess = JSON.parse(req.cookies.avPSess);
      getDataFromSessionId(sess.sessId)
        .then((data) => {
          const cookieData = JSON.parse(data.data.data[0].data);
          req.session["isAuthenticated"] = cookieData.isAuthenticated;
          req.session["aid"] = cookieData.aid;
          req.session.save(function (error) {
            if (error) {
              writeErrToFileForArticleVerificationPanel({
                when: `unable to save the session for admin having id ${cookieData.aid} when he has cookie`,
                where: "signIn() for article verification panel",
                error: `${error.message} here stack was ${error.stack}`,
              });
              resolve(res.send(
                resultObject(
                  0,
                  `Failed: something went wrong try again after sometime.`,
                  {}
                )
              ))
            } else {
              // no error in resaving session
            }
          });
          resolve(res.status(200).send(
            resultObject(1, `Success: success fully logged you in`, {
              uid: cookieData.aid,
              req: req.session,
            })
          ))
        })
        .catch((error) => {
          // no need to add log here
          resolve(res.send(resultObject(0, `${error.message}`, {})))
        });
    } else {
      // means cookie was not available at user side
      if (!req.session)
        throw new Error("Failed: your session has not setup properly");
      checkIfAdminExist(userId, password)
        .then((data) => {
          req.session.isAuthenticated = true;
          req.session.aid = data.data.adminId;
          req.session.save(function (error) {
            if (error) {
              writeErrToFileForArticleVerificationPanel({
                when: `unable to save the session for admin having id ${data.data.adminId} when he didn't have cookie`,
                where: "signIn() for article verification panel",
                error: `${error.message} here stack was ${error.stack}`,
              });
              resolve(res.send(
                resultObject(
                  0,
                  `Failed: something went wrong try again after sometime!!`,
                  {}
                )
              ))
            } else {
              // no error in resaving session
            }
          });
          console.log(1,req.session.id)
          console.log(req.session)
          resolve(res
            .status(202)
            .cookie("avPSess", JSON.stringify({ sessId: req.sessionID }), {
              sameSite: "strict",
              expires: new Date(new Date().getTime() + 60 * 60 * 1000),
              httpOnly: false,
              path: "/",
            })
            .send(data))
        })
        .catch((error) => {
          // no need to add logs here
          console.log(error)
          resolve(res.send(resultObject(0, `${error.message}`, {})));
        });
    }
  } catch (error) {
    writeErrToFileForArticleVerificationPanel({
      when: `unable to log in admin his admin id was ${userId}`,
      where: "signIn() for article verification panel",
      error: `${error.message} here stack was ${error.stack}`,
    });
    resolve(res.send(
      resultObject(
        0,
        "Failed: could not sign in you now try after sometime",
        {}
      )
    ))
  }
  })
};
const getUnverfiedArticles = (req, res) => {
  return new Promise((resolve,reject)=>{
    try {
      getAllunverifiedArticles()
        .then((data) => {
          resolve(res.send(data))
        })
        .catch((data) => {
          writeErrToFileForArticleVerificationPanel({
            when: `unable to get all unverifiedArticles for admin having aid ${req.session.aid}`,
            where: "getUnverfiedArticles() for article verification panel",
            error: `${data.message}`,
          });
          resolve(res.send(
            resultObject(0, `Failed: couldn't get unverified articles now`, {})
          ))
        });
    } catch (error) {
      writeErrToFileForArticleVerificationPanel({
        when: `unable to get all unverifiedArticles for admin having aid ${req.session.aid}`,
        where: "getUnverifiedArticles() for article verification panel",
        error: `${error.message} here stack was ${error.stack}`,
      });
      resolve(res.send(
        resultObject(0, `Failed: couldn't get unverified articles now`, {})
      ))
    }
  })
};
const getUnverfiedArticledata = (req, res) => {
  return new Promise((resolve,reject)=>{
    const articleId = req.body.articleId;
  try {
    getUnverifiedArticle(articleId)
      .then((data) => {
        let articleDetails = data;
        if (data.success === 1 && data.data.isCollected) {
          sortContentsInsideMainFile(
            data.data.articleDetails.mainFile,
            data.data.articleDetails.aid
          )
            .then((data) => {
              parseData(
                data.data.result,
                articleDetails.data.articleDetails.links,
                articleId
              )
                .then((data) => {
                  if (data.success === 1) {
                    objToReturn = {};
                    objToReturn["aid"] = articleDetails.data.articleDetails.aid;
                    objToReturn["contributor_id"] =
                      articleDetails.data.articleDetails.contributor_id;
                    objToReturn["data_of_submission"] =
                      articleDetails.data.articleDetails.date_of_submission;
                    objToReturn["last_update"] =
                      articleDetails.data.articleDetails.last_update;
                    objToReturn["paid"] =
                      articleDetails.data.articleDetails.paid;
                    objToReturn["status"] =
                      articleDetails.data.articleDetails.status;
                    objToReturn["tags"] =
                      articleDetails.data.articleDetails.tags;
                    objToReturn["title"] =
                      articleDetails.data.articleDetails.title;
                    objToReturn["content"] = data.data.result;
                    resolve(res.send(
                      resultObject(
                        1,
                        "Successfully got article article details",
                        objToReturn
                      )
                    ))
                  } else {
                    throw new Error("Failed: could not able to collect data");
                  }
                })
                .catch((data) => {
                  console.log(data.message);
                  // no need to add log here
                  resolve(res.send(
                    resultObject(
                      0,
                      `Failed: could n't able to collect data`,
                      {}
                    )
                  ))
                });
            })
            .catch((data) => {
              console.log(data.message);
              // no need to add log here
              resolve(res.send(
                resultObject(0, `Failed: could n't able to collect data`, {})
              ))
            });
        } else {
          throw new Error(`${data.message}`);
        }
      })
      .catch((data) => {
        // no need to add log here
        console.log(data)
        resolve(res.send(
          resultObject(0, `Failed: could n't able to collect data`, {})
        ))
      });
  } catch (error) {
    writeErrToFileForArticleVerificationPanel({
      when: `unable to get full data of unverified article having id ${articleId}`,
      where: "getUnverifiedArticleData() for article verification panel",
      error: `${error.message} here stack was ${error.stack}`,
    });
    resolve(res.send(
      resultObject(0, `Failed: could n't able to collect data`, {})
    ))
  }
  })
};
const discardArticleOfContributor = async (req, res) => {
  return new Promise((resolve,reject)=>{
    const { publisherId, articleId, comment } = req.body;
  try {
    if(comment.length<10){
      throw new Error('Failed: please enter a comment of at least 10 length')
    }
    addCommentInArticle(articleId, publisherId, "Admin", comment).then(
      (data) => {
        return discardArticle(articleId);
      }
    ).then((data)=>{
      resolve(res.send(resultObject(1, data.message, {})));
    }).catch((data) => {
      // no need to add log here
      resolve(res.send(resultObject(0, data.message, {})));
    });
  } catch (error) {
    console.log(error.message,error.stack)
    writeErrToFileForArticleVerificationPanel({
      when: `unable to discard article having aid ${articleId}`,
      where: "discardArticleOfContributor() for article verification panel",
      error: `${error.message} here stack was ${error.stack}`,
    });
    resolve(res.send(resultObject(0, error.message, {})));
  }
  })
};
const resendArticleToContributor = async (req, res) => {
  return new Promise((resolve,reject)=>{
    const { publisherId, articleId, comment } = req.body;
    
  try {
    if(comment.length<10){
      throw new Error('Failed: please enter a comment of at least 10 length')
    }
    addCommentInArticle(articleId, publisherId, "Admin", comment).then(
      (data) => {
        return resendArticle(articleId);
      }
    ).then((data)=>{
      resolve(res.send(resultObject(1, data.message, {})));
    }).catch((data) => {
      // no need to add log here
      resolve(res.send(resultObject(0, data.message, {})));
    });
  } catch (error) {
    // no need to add log here
    resolve(res.send(resultObject(0, error.message, {})));
  }
  })
};
const publishArticle = async (req, res) => {
  const { publisherId, articleId } = req.body;
  try {
    TurnUnverifiedArticleToVerifiedArticle(
      articleId,
      publisherId
    ).then((data)=>{
      res.send(resultObject(1, data.message, {}));
    }).catch((data)=>{
      // no need to add log here
      res.send(resultObject(0, data.message, {}));
    })
  } catch (error) {
    writeErrToFileForArticleVerificationPanel({
      when: `unable to publish article having id ${articleId}`,
      where: "publishArticle() for article verification panel",
      error: `${error.message} here stack was ${error.stack}`,
    });
    res.send(resultObject(0, error.message, {}));
  }
};
module.exports = {
  signIn,
  getUnverfiedArticles,
  getUnverfiedArticledata,
  publishArticle,
  resendArticleToContributor,
  discardArticleOfContributor,
};
