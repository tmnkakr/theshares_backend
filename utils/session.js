const { rejects } = require("assert");
const { resolve } = require("path");
const { get_connection_from_pool, do_query } = require("../models/dbModel");
const {
  articleVerificationPanelUserTokens,
} = require("../static/tables");
const {
  generateResponse,
  writeErrToFile,
  writeErrToFileForArticleVerificationPanel,
  resultObject,
} = require("./commonUtils");

const getDataFromSessionId = async (session_id) => {
    return new Promise(async (resolve,reject)=>{
        try{
            const connection = await get_connection_from_pool();
            const sqlQuery = `select * from ${articleVerificationPanelUserTokens} where session_id=? limit 1`;
            const data = await do_query(connection, sqlQuery, [
                session_id
            ]);
            if(data.length === 0) {
                throw new Error('Failed: could not collect details regarding this session id')
            } else {
                resolve(resultObject(1,`Success: successfully got data for this session id`,{
                    data
                }))
            }
        } catch(error){
            writeErrToFileForArticleVerificationPanel({
                when: `unable to coollect data from session id ${session_id} in article verification panel`,
                where: "getDataFromSessionId()",
                error: `${error.message} here stack was ${error.stack}`,
            });
            reject(resultObject(0,`${error.message} here stack was ${error.stack}`,{}))
        }
    })
}

module.exports = {
    getDataFromSessionId
}
