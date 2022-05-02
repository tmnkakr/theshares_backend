const { ifUserExistByEmail } = require("../utils/enquiryAboutUser");
const { get_connection_from_pool, do_query } = require("../models/dbModel");
const {
  generateResponse,
  writeErrToFile,
  resultObject,
} = require("../utils/commonUtils");
const { hashData } = require("../utils/privateUtils");
const { userProfile, users } = require("../static/tables");

const loginViaEmailAndPassword = async function (req,res) {
  const email = req.body.email;
  const password = req.body.password;
  const connection = await get_connection_from_pool();
  try {
    const enPassword = await hashData(password);
    if (enPassword.success === 0) throw Error(enPassword.message);
    const sql1 = `select * from ${users} where email=? and password=?`;
    const result1 = await do_query(connection, sql1, [
      email,
      enPassword.data[0],
    ]);
    if (result1.length != 0) {
      console.log("sign in");
      return res.send(resultObject(1, "Successfully signed in", []));
    } else {
      console.log("Couldn't find out user");
      return res.send(resultObject(0, "Couldn't find out user", []));
    }
  } catch (error) {
    writeErrToFile({
      when: "Loging in Via email and passoword",
      error: error.message,
      where: "loginViaEmailAndPassword()",
    });
    return res.send(resultObject(
      0,
      "Failed: unable to logging in via email and password",
      []
    ));
  }
};

const appLogin = async function (req, res) {
  // still incomplete
  const mode = 0;
  try {
    switch (mode) {
      case 0: // sign in via email and password
        loginViaEmailAndPassword(req,res);
        break;
      case 1: // login via google
        break;
    }
  } catch (error) {
    writeErrToFile({
      when: "occured when calling app login function",
      error: error.message,
    });
    return generateResponse(0, "failed to login", []);
  }
};


module.exports = {
  appLogin,
};
