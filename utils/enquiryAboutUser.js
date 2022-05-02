const { get_connection_from_pool, do_query } = require("../models/dbModel");

const { userProfile,users } = require("../static/tables");
const { writeErrToFile, resultObject } = require("./commonUtils");
const ifUserExistByEmail = async function (email) {
  try{
    const connection = await get_connection_from_pool();
    const sqlQuery = `SELECT email from ${users} where email=?`;
    const data = await do_query(connection, sqlQuery, [email]);
    const result = data.length !== 0 ? resultObject(1,"UserExist",[true]) : resultObject(1,"User Not Exist",[false]);
    return result
  } catch (error){
    writeErrToFile({
      when:"while checking existence of user",
      where:"ifUserExistByEmail()",
      error:error.message
    })
    return resultObject(0,"Couldn't check existence of user",[])
  }
  
};
const ifUserExistByUid = async function (uid) {
  try{
    const connection = await get_connection_from_pool();
  const sqlQuery = `SELECT uid from ${userProfile} where uid=?`;
  const data = await do_query(connection, sqlQuery, [uid]);
  return data.length != 0 ? true : false;F
  } catch (error){
    writeErrToFile({
      data:{
        uid
      },
      error:error.error,
    })
  }
};


// async function temp() {
//   const data = await ifUserExistByUid(10);
//   console.log(data);
// }
// temp();
module.exports = {
    ifUserExistByEmail,
    ifUserExistByUid
}