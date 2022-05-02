const { get_connection_from_pool, do_query } = require("../models/dbModel");
const {
  unofficialArticleTable,
  publishedArticles,
} = require("../static/tables");
const {
  generateResponse,
  writeErrToFile,
  resultObject,
} = require("./commonUtils");
const addVerifiedArticleToDb = async (
  articleTitle,
  contributor_id,
  aid,
  article_status,
  tags,
  path_of_directory_on_server,
  connection
) => {
  return new Promise(async (resolve, reject) => {
    try {
      let didConnectionPassed = true;
      if (!connection) {
        didConnectionPassed = false;
        connection = await get_connection_from_pool();
      }

      const sqlQuery = `insert into ${publishedArticles} (contributor_id,aid,tags,status,path_of_directory_on_server,title) values (?,?,?,?,?,?)`;
      const data = await do_query(connection, sqlQuery, [
        contributor_id,
        aid,
        tags,
        article_status,
        path_of_directory_on_server,
        articleTitle,
      ]);
      if (!didConnectionPassed) await connection.release();

      if (data.affectedRows === 0)
        throw new Error("Failed: couldn't insert into db");
      resolve(
        resultObject(
          1,
          `Success: successfully added a verified article having aid ${data.insertId}`,
          { insertedId: data.insertId }
        )
      );
    } catch (error) {
      writeErrToFile({
        when: "while inserting verified articles in db!",
        where: "addVerifiedArticleToDb()",
        error: `${error.message} here stack was ${error.stack}`,
      });
      reject(resultObject(0, error.message, {}));
    }
  });
};
const checkIfArticleIsAlreadyAvailableInDb = async (articleTitle,aid) => {
  return new Promise(async (resolve, reject) => {
    try {
      const connection = await get_connection_from_pool();
      const sqlQuery = `select * from ${publishedArticles} where title=? or aid=?`;
      const data = await do_query(connection, sqlQuery, [
        articleTitle,
        aid
      ]);
      await connection.release();
      if(data.length) resolve(resultObject(1,`Success: article exist`,{ result: true}))
      else resolve(resultObject(1,`Success: article don't exist`,{ result: false}))
    } catch (error) {
        writeErrToFile({
            when: "while checking existence of article in published db",
            where: "checkIfArticleAlreadyAvailableInDb()",
            error: `${error.message} here stack was ${error.stack}`,
          });
          reject(resultObject(0, error.message, {}));
    }
  });
};
module.exports = {
  addVerifiedArticleToDb,
  checkIfArticleIsAlreadyAvailableInDb
};

// async function temp () {
//   try{
//     const data = await addVerifiedArticleToDb()
//     console.log(data)
//   } catch (error){
//     writeErrToFile({
//       when: "while checking existence of article in published db",
//       where: "checkIfArticleAlreadyAvailableInDb()",
//       error: `${error.message} here stack was ${error.stack}`,
//     });
//   }
    
// }
// temp()