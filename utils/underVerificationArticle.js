// this file is related to database
const {
  get_connection_from_pool,
  do_query,
  begin_transaction,
  commit_transaction,
  rollback,
} = require("../models/dbModel");
const { unofficialArticleTable, publishedArticleRecord } = require("../static/tables");
const path = require("path");
const { getAllFilesInsideDirectory } = require("./localSystemStorage");
const {
  generateResponse,
  writeErrToFile,
  resultObject,
  writeErrToFileForArticleVerificationPanel,
} = require("./commonUtils");
const {
  getUnverifiedArticleDetailsWithoutFiles,
} = require("./collectUnverifiedArticleDetails");
const {
  checkIfArticleIsAlreadyAvailableInDb,
  addVerifiedArticleToDb,
} = require("./verifiedArticleTools");
const fs = require('fs')
const { uploadVerifiedArticleToFirestore } = require("./firestoreDatabase")
const {
  checkIfDataExistOnCloudDirectory,
  deleteDataInsideCloudDirectory,
  downloadAllFilesFromaDirectoryOnCloud,
  uploadFilesToCloudDirectory,
} = require("./firebaseStorage");
const {
  commonPathForPublishedArticles,
  commonPathForStoringUnverifiedArticlesOnLocalSystem,
} = require("./appConstants");

/**
 * This function add specific article to the database
 * @param {String} articleTitle
 * @param {int} article_contributor
 * @param {int} articles_status
 * @param {String} tags
 * @param {String} path_of_directory_on_server
 * @param {*} connection
 * @returns object
 */
const addUnVerifiedArticle = async (
  articleTitle,
  article_contributor,
  articles_status,
  tags,
  path_of_directory_on_server,
  connection
) => {
  try {
    let didConnectionPassed = true;
    if (!connection) {
      didConnectionPassed = false;
      connection = await get_connection_from_pool();
    }
    const sqlQuery = `insert into ${unofficialArticleTable} (title,contributor_id,status,tags,path_of_directory_on_server) values (?,?,?,?,?)`;
    const data = await do_query(connection, sqlQuery, [
      articleTitle,
      article_contributor,
      articles_status,
      tags,
      path_of_directory_on_server,
    ]);
    if (!didConnectionPassed) await connection.release();
    if (data.affectedRows === 0)
      throw new Error(
        "Failed: data could not get inserted in unverified article's table"
      );
    return resultObject(
      1,
      `Success: successfully added aa unverified article having aid ${data.insertId}`,
      { result: true, insertedId: data.insertId }
    );
  } catch (error) {
    return resultObject(0, `${error.message}`, {});
  }
};

const getAllunverifiedArticles = async () => {
  return new Promise(async (resolve, reject) => {

    try {
      const connection = await get_connection_from_pool();
      const sqlQuery = `select * from  ${unofficialArticleTable} where status = ? limit 500`;
      const data = await do_query(connection, sqlQuery, [
        0,
      ]);

      await connection.release();
      resolve(resultObject(
        1,
        `Success: successfully got all articles`,
        { articles: data }
      ));
    } catch (error) {
      writeErrToFile({
        when: `unable to get all unverified articles`,
        where: "getAllUnverifiedArticles()",
        error: `${error.message} here stack was ${error.stack}`,
      });
      reject(resultObject(0, `${error}`, {}));
    }
  })
}
const addArticleToPublishedRecords = async (p_aid, aid, contributor_id, publisher_id, connection) => {
  return new Promise(async (resolve, reject) => {
    try {
      let didConnectionPassed = true;
      if (!connection) {
        didConnectionPassed = false;
        connection = await get_connection_from_pool();
      }
      const sqlQuery = `insert into ${publishedArticleRecord} (aid,p_aid,contributor_id,publisher_id) values(?,?,?,?)`;
      const data = await do_query(connection, sqlQuery, [
        aid, p_aid, contributor_id, publisher_id
      ]);

      if (!didConnectionPassed) await connection.release();
      if (data.affectedRows === 0)
        throw new Error(
          `Failed: couldn't add data into published article records where aid = ${aid} and p_aid was ${p_aid}`
        );
      resolve(resultObject(
        1,
        `Success: successfully added data into published article records where article aid=${aid} and  p_aid=${p_aid}`,
        {}
      ));
    } catch (error) {
      writeErrToFile({
        when: error.message,
        where: "addArticleToPublishedRecords()",
        error: `${error.message} here stack was ${error.stack}`,
      });
      reject(resultObject(0, `${error}`, {}));
    }
  })
}
const addPublishedIdToUnverifiedArticle = async (pid, aid, connection) => {
  return new Promise(async (resolve, reject) => {
    try {
      let didConnectionPassed = true;
      if (!connection) {
        didConnectionPassed = false;
        connection = await get_connection_from_pool();
      }
      const sqlQuery = `update ${unofficialArticleTable} set paid=?,status=? where aid=?;`;
      const data = await do_query(connection, sqlQuery, [
        pid, 1, aid,
      ]);

      if (!didConnectionPassed) await connection.release();
      if (data.affectedRows === 0)
        throw new Error(
          `Failed: couldn't add publishedId ${pid} in unOfficial article table where aid was=${aid}`
        );
      resolve(resultObject(
        1,
        `Success: successfully added a published id to unOfficial article having id ${aid}`,
        {}
      ));
    } catch (error) {
      writeErrToFile({
        when: `unable to add published article id to a unverified article having aid =${aid}`,
        where: "addPublishedIdToUnverifiedArticle()",
        error: `${error.message} here stack was ${error.stack}`,
      });
      reject(resultObject(0, `${error}`, {}));
    }
  })
}
const TurnUnverifiedArticleToVerifiedArticle = async (article_id, publisherId) => {
  return new Promise(async (resolve, reject) => {
    const connection = await get_connection_from_pool();
    let currentStatus;
    let articleTitle;
    let contributorId;
    let tags;
    let aid;
    let pathOfDirectoryOnUnofficialCloud;
    let localPath;
    let pathOfDirectoryOnOfficialCloud;
    let filesTobeUploaded;
    let configFileData;
    let mainFileData;
    let publishedId;
    let filesTobeUploadedCopy;
    await begin_transaction(connection);
    try {
      // verifiying wheather article is actually under verification or not
      getUnverifiedArticleDetailsWithoutFiles(
        article_id
      ).then((unOfficialArticleDetails)=>{
        currentStatus = unOfficialArticleDetails.data.result.status;
        articleTitle = unOfficialArticleDetails.data.result.title;
        contributorId = unOfficialArticleDetails.data.result.contributor_id;
        tags = unOfficialArticleDetails.data.result.tags;
        aid = unOfficialArticleDetails.data.result.aid;
        pathOfDirectoryOnUnofficialCloud = unOfficialArticleDetails.data.result.path_of_directory_on_server;
        if (currentStatus !== 0)
        {
          reject(resultObject(0, `Failed: article is already verified `, {}));
        } else {
            // checking wheather it is the first time of article publish or not
            return checkIfArticleIsAlreadyAvailableInDb();
        }
          
      }).then((result)=>{
        if (result.success === 0) {
          throw new Error(result.message);
        } else {
          if (result.data.result) {
            // means article already exist so we have to update it
            //TODO: code of updating article will come here
          } else {
            // means article is very new to publish
            localPath = path.join(
              __dirname,
              `../${commonPathForStoringUnverifiedArticlesOnLocalSystem}/${contributorId}/${articleTitle}`
            );
            downloadAllFilesFromaDirectoryOnCloud(
              pathOfDirectoryOnUnofficialCloud,
              localPath
            ).then((result)=>{
              if (result.success === 0) {throw new Error(result.message);}
              else {
                // means files have been downloaded from unverified article
                return getAllFilesInsideDirectory(localPath)
                
              }
            }).then((result)=>{
              console.log('files has been readed')
              if(result.success!=1){
                throw new Error(result.message)
              } else {
                // means we have all files which were downloaded
                pathOfDirectoryOnOfficialCloud = `${commonPathForPublishedArticles}/${contributorId}/${articleTitle}`;
                if (result.data.configFile.length != 1) throw new Error(`either 0 or more that 1 config file was found at ${localPath}`)
                  if (result.data.mainFile.length != 1) throw new Error(`either 0 or more that 1 main file was found at ${localPath}`)
                  filesTobeUploaded = [...result.data.mp4Files, ...result.data.jpgFiles, ...result.data.configFile, ...result.data.mainFile, ...result.data.pngFiles];
                  configFileData = JSON.parse(fs.readFileSync(result.data.configFile[0]))
                  mainFileData = JSON.parse(fs.readFileSync(result.data.mainFile[0]))
                  return addVerifiedArticleToDb(
                    articleTitle,
                    contributorId,
                    aid,
                    1,
                    tags,
                    pathOfDirectoryOnOfficialCloud,
                    connection
                  );
              }
            }).then((result)=>{
              if (result.success !=1) {throw new Error(result.message);}
              else {
                publishedId = result.data.insertedId;
                return checkIfDataExistOnCloudDirectory(
                  pathOfDirectoryOnOfficialCloud
                )
              }
            }).then(async (result)=>{
              if (result.success === 0) {throw new Error(result.message);}
              else {
                let dataFound = false;
                      if (result.data.result) {
                        // means data is available
                        dataFound = true;
                        result = await deleteDataInsideCloudDirectory(
                          pathOfDirectoryOnOfficialCloud
                        );
                        if (result.success === 1 && result.data.result) {
                          // means data has been deleted
                          dataFound = false;
                        } else {
                          throw new Error(result.message);
                        }
                      }
                      if (!dataFound) {
                        // means no data is available we are ready to upload new data
                        filesTobeUploadedCopy = Array.from(filesTobeUploaded)
                        return uploadFilesToCloudDirectory(filesTobeUploaded, pathOfDirectoryOnOfficialCloud)
                      } else {
                        throw new Error(`Couldn't delete data from cloud storage on ${pathOfDirectoryOnOfficialCloud}`)
                      }
              }
            }).then((result)=>{
              if (result.success === 1 && result.data.result && (result.data.length === filesTobeUploadedCopy.length)) {
              return uploadVerifiedArticleToFirestore(publishedId, mainFileData, configFileData)
              } else {
                // means something went wrong in file uploading
                throw new Error(result.message)
              }

            }).then((result)=>{
              if (result.success === 0) {throw new Error(result.message)}
              else{
                // means article details have been uploaded to firestore
                return addPublishedIdToUnverifiedArticle(publishedId, aid, connection)
              }
            }).then((result)=>{
              if (result.success === 0) {throw new Error(result.message)}
              else {
                // means published id have been added in unOffical article table
                return addArticleToPublishedRecords(publishedId, aid, contributorId, publisherId, connection)
              }
            }).then(async (result)=>{
              if (result.success == 0) {throw new Error(result.message)}
              else {
                // means everything has been done properly
                await commit_transaction(connection)
                console.log('Successfully changed an article from unverified to verified')
                resolve(resultObject(1, `Success: successfully verified the article`, {}))
              }
            }).catch(async (error)=>{
              await rollback(connection)
              // error.message
              writeErrToFile({
                when: "unable to add unverified article to verified table!",
                where: "TurnUnverifiedArticleToVerifiedArticle()",
                error: `${error.message} here stack was ${error.stack}`,
              });
              console.log(error.message);
              reject(resultObject(0, `Failed: couldn't able to publish article having aid ${article_id}`, {}))
            })
          }
        }
      }).catch(async (error)=>{
       try{
        await rollback(connection)
       } catch(err){

       }
              writeErrToFile({
                when: "unable to add unverified article to verified table!",
                where: "TurnUnverifiedArticleToVerifiedArticle()",
                error: `${error.message} here stack was ${error.stack}`,
              });
              console.log(error.message);
              reject(resultObject(0, `Failed: couldn't able to publish article having aid ${article_id}`, {}))
      })   
      
    } catch (error) {
      try{
        await rollback(connection)
      } catch(error){}
      writeErrToFile({
        when: "unable to add unverified article to verified table!",
        where: "TurnUnverifiedArticleToVerifiedArticle()",
        error: `${error.message} here stack was ${error.stack}`,
      });
      console.log(error.message);
      reject(resultObject(0, `Failed: couldn't able to verify article with aid ${article_id}`, {}))
    }
  });
};
const discardArticle = async (aid) => {
  return new Promise(async (resolve, reject) => {
    try {
      const connection = await get_connection_from_pool();
      const sqlQuery = `update ${unofficialArticleTable} set status=-2 where aid=?`;
      const data = await do_query(connection, sqlQuery, [
        aid,
      ]);

      await connection.release();
      if (data.affectedRows === 0) {
        throw new Error(
          `Failed: unable to discard article having aid=${aid}`
        );
      }
      resolve(resultObject(
        1,
        `Success: successfully discarded article`,
        {}
      ));
    } catch (error) {
      writeErrToFileForArticleVerificationPanel({
        when: `unable to discard article having aid=${aid}`,
        where: "discardArticle()",
        error: `${error.message} here stack was ${error.stack}`,
      });
      reject(resultObject(0, `${error}`, {}));
    }
  })
}
const resendArticle = async (aid) => {
  return new Promise(async (resolve, reject) => {
    try {
      const connection = await get_connection_from_pool();
      const sqlQuery = `update ${unofficialArticleTable} set status=2 where aid=?`;
      const data = await do_query(connection, sqlQuery, [
        aid,
      ]);

      await connection.release();
      if (data.affectedRows === 0) {
        throw new Error(
          `Failed: unable to resend article having aid=${aid}`
        );
      }
      resolve(resultObject(
        1,
        `Success: successfully resend article`,
        {}
      ));
    } catch (error) {
      writeErrToFileForArticleVerificationPanel({
        when: `unable to resend article having aid=${aid}`,
        where: "resendArticle()",
        error: `${error.message} here stack was ${error.stack}`,
      });
      reject(resultObject(0, `${error}`, {}));
    }
  })
}
module.exports = {
  TurnUnverifiedArticleToVerifiedArticle,
  addUnVerifiedArticle,
  getAllunverifiedArticles,
  addPublishedIdToUnverifiedArticle,
  addArticleToPublishedRecords,
  discardArticle,
  resendArticle
};
// async function temp() {
//   const data = await getAllunverifiedArticles()
//   console.log(data.data.articles);
//   console.log('end')
// }
// temp();
