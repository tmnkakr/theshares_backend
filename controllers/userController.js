const { ifUserExistByEmail } = require("../utils/enquiryAboutUser");
const {
  get_connection_from_pool,
  do_query,
  begin_transaction,
  commit_transaction,
  rollback,
  sqlQuery,
} = require("../models/dbModel");
const {
  generateResponse,
  writeErrToFile,
  resultObject,
} = require("../utils/commonUtils");
const { hashData, encryptData } = require("../utils/privateUtils");
const { userProfile, users } = require("../static/tables");
const addToUserShortDetails = async function (
  email,
  mode,
  password,
  connection
) {
  try {
    const en_email = await encryptData(email);
    if (en_email.success === 0) throw new Error(en_email.message);
    const h_password = await hashData(password);
    if (h_password.success !== 1) throw new Error(h_password.message);
    if (connection) {
      // when connection was passed already
      const sql1 = `INSERT INTO ${users}(email,password,en_email,mode) values (?,?,?,?)`;
      const result1 = await do_query(connection, sql1, [
        email,
        h_password.data[0],
        en_email.data[0],
        mode,
      ]);
      if (result1.affectedRows !== 0) {
        // data successfully inserted
        return resultObject(
          1,
          "short information of user successfully stored!",
          [result1.insertId]
        );
      } else {
        // data insertion failed
        throw new Error(
          "short information of user can't be stored successfully!!"
        );
      }
    } else {
      // when connection was not passed
      const sql1 = `INSERT INTO ${users}(email,password,en_email,mode) values (?,?,?,?)`;
      const result1 = await sqlQuery(sql1, [
        email,
        h_password.data[0],
        en_email.data[0],
        mode,
      ]);
      if (result1.affectedRows !== 0) {
        // data successfully inserted
        return resultObject(
          1,
          "short information of user successfully stored!",
          [result1.insertId]
        );
      } else {
        // data insertion failed
        throw new Error(
          "short information of user can't be stored successfully!!"
        );
      }
    }
  } catch (error) {
    writeErrToFile({
      when: "while adding user short details",
      where: "addToUserShortDetails()",
      error: error.message,
    });
    return resultObject(0, error.message, []);
  }
};
const addToUserFullDetails = async function (
  first_name,
  last_name,
  profile_pic,
  uid,
  phone,
  dob,
  email,
  connection
) {
  try {
    if (connection) {
      // when connection is passed already
      const sql1 = `INSERT INTO ${userProfile}(first_name,last_name,profile_pic,uid,phone,dob,email) values (?,?,?,?,?,?,?)`;
      const result1 = await do_query(connection, sql1, [
        first_name,
        last_name,
        profile_pic,
        uid,
        phone,
        dob,
        email,
      ]);
      if (result1.affectedRows !== 0) {
        // data asuccessfully inserted
        return resultObject(
          1,
          "full information of user inserted successfully!",
          []
        );
      } else {
        throw new Error("full information of user can't be inserted!");
      }
    } else {
      // when connection was not passed
      const sql1 = `INSERT INTO ${userProfile}(first_name,last_name,profile_pic,phone,dob,email) values (?,?,?,?,?,?)`;

      const result1 = await sqlQuery(sql1, [
        first_name,
        last_name,
        profile_pic,
        phone,
        dob,
        email,
      ]);
      if (result1.affectedRows !== 0) {
        // data asuccessfully inserted
        return resultObject(
          1,
          "full information of user inserted successfully!",
          []
        );
      } else {
        throw new Error("full information of user can't be inserted!");
      }
    }
  } catch (error) {
    writeErrToFile({
      when: "while adding full user details!",
      where: "addToUserFullDetails()",
      error: error.message,
    });
    return resultObject(0, error.message, []);
  }
};
const addUser = async function (req, res) {
  
  const email = req.body.email;
  const mode = 0;
  const password = req.body.password;
  const first_name = req.body.first_name;
  const last_name = req.body.last_name;
  const profile_pic = req.body.profile_pic;
  let phone = req.body.phone;
  const dob = req.body.dob;
  console.log(email, password, mode);
  const connection = await get_connection_from_pool();
  await begin_transaction(connection);
  try {
    const userExistence = await ifUserExistByEmail(email);
    if (userExistence.success === 1) {
      if (userExistence.data[0] === false) {
        // user not exist
        const result1 = await addToUserShortDetails(
          email,
          mode,
          password,
          connection
        );
        if (result1.success !== 1) throw new Error(result1.message);
        const uid = result1.data[0];
        const result2 = await addToUserFullDetails(
          first_name,
          last_name,
          profile_pic,
          uid,
          phone,
          dob,
          email,
          connection
        );

        if (result2.success !== 1) throw new Error(result2.message);
        await commit_transaction(connection);
        return res.send(
          generateResponse(1, "Success: successfully inserted user data",[]));
      } else {
        // user already exist
        return res.send(generateResponse(0, "account already exist!", []));
      }
    }
  } catch (error) {
    await rollback(connection);
    writeErrToFile({
      when: "while adding user",
      where: "addUser()",
      error: error.message,
    });
    console.log(error.message);
    res.send(generateResponse(0, "Could n't add you right now", []));
  }
};

module.exports = {
  addUser,
};
