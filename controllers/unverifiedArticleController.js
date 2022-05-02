const {
  generateResponse,
  writeErrToFile,
  resultObject,
} = require("../utils/commonUtils");
const {
  underVerificationArticle,
  unofficialArticleTable,
} = require("../static/tables");
const {
  get_connection_from_pool,
  do_query,
  begin_transaction,
  commit_transaction,
  rollback,
  sqlQuery,
} = require("../models/dbModel");
const { commonPathForUnverifiedArticles } = require("../utils/appConstants");
const getUnverifiedArticles = async (req, res) => {
  try {
    const connection = await get_connection_from_pool();
    const sqlQuery1 = `SELECT * from ${unofficialArticleTable} where status=0`;
    let data = await do_query(connection, sqlQuery1, []);
    await connection.release();
    if (data.length === 0) {
      res.send(
        resultObject(1, `Success: There is no unverified article found`, {
          ifArticlesAvailable: false,
          result: [],
        })
      );
    } else {
      let resultantArticles = [];
      for (let i = 0; i < data.length; i++) {
        resultantArticles.push(data[i]);
      }
      res.send(
        resultObject(1, `Success: We have got unverified articles`, {
          ifArticlesAvailable: true,
          result: resultantArticles,
        })
      );
    }
  } catch (error) {
    writeErrToFile({
      when: "while getting unverified articles!",
      where: "getUnverifiedArticles()",
      error: `${error.message} here stack was ${error.stack}`,
    });
    res.send(resultObject(0, `Failed: To get unverified articles`, {}));
  }
};

module.exports = {
  getUnverifiedArticles,
};
