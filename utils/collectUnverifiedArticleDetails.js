const {
  generateResponse,
  writeErrToFile,
  resultObject,
} = require("./commonUtils");
const {
  getAllMediaFilesDownloadLinkForAnUnverifiedArticle,
} = require("./firebaseStorage");
const {
  getDataForUnverifiedArticleFromFirestore,
} = require("./firestoreDatabase");
const {
  unofficialArticleTable,
} = require("../static/tables");
const { commonPathForPublishedArticles,commonPathForUnverifiedArticles } = require("./appConstants")
const { get_connection_from_pool, do_query } = require("../models/dbModel");

const getUnverifiedArticleStatus = async function (article_id) {
  return new Promise(async (resolve,reject)=>{
    try {
      const connection = await get_connection_from_pool();
      const sqlQuery = `SELECT status from ${unofficialArticleTable} where aid=?`;
      const data = await do_query(connection, sqlQuery, [article_id]);
      if(data.length===0) resolve(resultObject(0,`Failed: couldn't find the article`,{}))
      else resolve(resultObject(1,`Success: successfully found the article`,{result:data[0].status}))
    } catch(error){
      writeErrToFile({
        when: `while getting unverified article status having aid ${article_id}!`,
        where: "getArticleStatus()",
        error: `${error.message} here stack was ${error.stack}`,
      });
      reject(resultObject(0, `Failed: To get article status`, {}));
    }
  })
};
const getUnverifiedArticleDetailsWithoutFiles = async (article_id) => {
  return new Promise(async (resolve,reject)=>{
    try {
      const connection = await get_connection_from_pool();
      const sqlQuery = `SELECT * from ${unofficialArticleTable} where aid=?`;
      const data = await do_query(connection, sqlQuery, [article_id]);
      await connection.release()
      if(data.length===0) resolve(resultObject(0,`Failed: couldn't find the article`,{}))
      else resolve(resultObject(1,`Success: successfully found the article`,{result:data[0]}))
    } catch(error){
      writeErrToFile({
        when: `while getting unverified article details having aid ${article_id}!`,
        where: "getUnverifiedArticleDetailsWithoutFiles()",
        error: `${error.message} here stack was ${error.stack}`,
      });
      reject(resultObject(0, `Failed: To get article details`, {}));
    }
  })
};

const getUnverifiedArticle = async (article_id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const connection = await get_connection_from_pool();
      const sqlQuery1 = `SELECT * from ${unofficialArticleTable} where status=0 and aid=? LIMIT 1`;
      let data = await do_query(connection, sqlQuery1, [article_id]);
      await connection.release();

      if (data.length === 0) {
        resolve(
          resultObject(1, `Success: couldn't find article`, {
            isCollected: false,
          })
        );
      } else {
        let firestoreResponse;
        let articleDetails = data[0];
        firestoreResponse = await getDataForUnverifiedArticleFromFirestore(
          data[0].aid
        );
        if (firestoreResponse.success === 1 && firestoreResponse.data.hasData) {
          // means data is consistent
          articleDetails.mainFile = firestoreResponse.data.result.mainFile;
          // now getting live links for media
          const obj = await getAllMediaFilesDownloadLinkForAnUnverifiedArticle(
            `${commonPathForUnverifiedArticles}/${data[0].contributor_id}/${data[0].title}`
          );
          if (obj.success === 1 && obj.data.isDataFetchedFully)
            {articleDetails.links = obj.data.result;}
          else throw new Error(obj.message);
          resolve(
            resultObject(1, `Success: successfully got article details`, {
              isCollected: true,
              articleDetails,
            })
          );
        }
        
        resolve(
          resultObject(0, `Failed: couldn't got article details fully`, {
            isCollected: false,
          })
        );
      }
    } catch (error) {
      writeErrToFile({
        when: `while getting unverified article detail having aid ${article_id}!`,
        where: "collectArticleDetails()",
        error: `${error.message} here stack was ${error.stack}`,
      });
      reject(resultObject(0, `${error.message} here stack was ${error.stack}`, {}));
    }
  });
};
module.exports = {
  getUnverifiedArticleStatus,
  getUnverifiedArticleDetailsWithoutFiles,
  getUnverifiedArticle
};
// async function temp(){
//   const data = await getUnverifiedArticle(2)
//   console.log(data)
// }
// temp()

