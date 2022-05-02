const { get_connection_from_pool, do_query } = require("../models/dbModel");

const { userProfile } = require("../static/tables");
const { resultObject } = require("./commonUtils");
const getUserName = async function (uid) {
  try {
    const connection = await get_connection_from_pool();
    const sqlQuery = `SELECT first_name,last_name from ${userProfile} where uid=?`;
    const data = await do_query(connection, sqlQuery, [uid]);
    await connection.release();
    if (data.length !== 0) {
      return resultObject(1, "Success: successfully collect the name of user", [
        data[0].first_name,
        data[0].last_name,
      ]);
    } else {
      return resultObject(1, "Success: could find user having such id", []);
    }
  } catch (error) {
    writeErrToFile({
      when: "while getting user name!",
      where: "getUserName()",
      error: error.message,
    });
    return resultObject(
      0,
      "Failed: something went wrong in getting user name",
      []
    );
  }
};
const getUserProfilePic = async function (uid) {
  try {
    const connection = await get_connection_from_pool();
    const sqlQuery = `SELECT profile_pic from ${userProfile} where uid=?`;
    const data = await do_query(connection, sqlQuery, [uid]);
    await connection.release();
    if (data.length !== 0) {
      return resultObject(
        1,
        "Success: successfully collect the profile pic of user",
        [data[0].profile_pic]
      );
    } else {
      return resultObject(1, "Success: could find user having such id", []);
    }
  } catch (error) {
    writeErrToFile({
      when: "while getting user profile pic!",
      where: "getUserProfilePic()",
      error: error.message,
    });
    return resultObject(
      0,
      "Failed: something went wrong in getting user profile pic",
      []
    );
  }
};
const getUserStatus = async function (uid) {
  try {
    const connection = await get_connection_from_pool();
    const sqlQuery = `SELECT status from ${userProfile} where uid=?`;
    const data = await do_query(connection, sqlQuery, [uid]);
    await connection.release();
    if (data.length !== 0) {
      return resultObject(
        1,
        "Success: successfully collected the status of user",
        [data[0].status]
      );
    } else {
      return resultObject(1, "Success: could find user having such id", []);
    }
  } catch (error) {
    writeErrToFile({
      when: "while getting user status!",
      where: "getUserStatus()",
      error: error.message,
    });
    return resultObject(
      0,
      "Failed: something went wrong in getting user status",
      []
    );
  }
};
const getUserPhones = async function (uid) {
  try {
    const connection = await get_connection_from_pool();
    const sqlQuery = `SELECT phone from ${userProfile} where uid=?`;
    const data = await do_query(connection, sqlQuery, [uid]);
    await connection.release();
    if (data.length !== 0) {
      return resultObject(
        1,
        "Success: successfully collected the phone number(s) of user",
        [data[0].phone?.split(",")]
      );
    } else {
      return resultObject(1, "Success: could find user having such id", []);
    }
  } catch (error) {
    writeErrToFile({
      when: "while getting user phone number!",
      where: "getUserPhones()",
      error: error.message,
    });
    return resultObject(
      0,
      "Failed: something went wrong in getting user Phone(s)",
      []
    );
  }
};
const getUserDateOfJoin = async function (uid) {
  try {
    const connection = await get_connection_from_pool();
    const sqlQuery = `SELECT doj from ${userProfile} where uid=?`;
    const data = await do_query(connection, sqlQuery, [uid]);
    await connection.release();
    if (data.length !== 0) {
      return resultObject(
        1,
        "Success: successfully collected the date of join of user",
        [data[0].doj]
      );
    } else {
      return resultObject(1, "Success: could find user having such id", []);
    }
  } catch (error) {
    writeErrToFile({
      when: "while getting user date of join!",
      where: "getUserDateOfJoin()",
      error: error.message,
    });
    return resultObject(
      0,
      "Failed: something went wrong in getting user date of join",
      []
    );
  }
};
const getUserDateOfBirth = async function (uid) {
  try {
    const connection = await get_connection_from_pool();
    const sqlQuery = `SELECT dob from ${userProfile} where uid=?`;
    const data = await do_query(connection, sqlQuery, [uid]);
    await connection.release();
    if (data.length !== 0) {
      return resultObject(
        1,
        "Success: successfully collected the date of birth of user",
        [data[0].dob]
      );
    } else {
      return resultObject(1, "Success: could find user having such id", []);
    }
  } catch (error) {
    writeErrToFile({
      when: "while getting user date of birth!",
      where: "getUserDateOfBirth()",
      error: error.message,
    });
    return resultObject(
      0,
      "Failed: something went wrong in getting user date of birth",
      []
    );
  }
};
const getUserEmail = async function (uid) {
  try {
    const connection = await get_connection_from_pool();
    const sqlQuery = `SELECT email from ${userProfile} where uid=?`;
    const data = await do_query(connection, sqlQuery, [uid]);
    await connection.release();
    if (data.length !== 0) {
      return resultObject(
        1,
        "Success: successfully collected the email of user",
        [data[0].email]
      );
    } else {
      return resultObject(1, "Success: could find user having such id", []);
    }
  } catch (error) {
    writeErrToFile({
      when: "while getting email of user!",
      where: "getUserEmail()",
      error: error.message,
    });
    return resultObject(
      0,
      "Failed: something went wrong in getting user email",
      []
    );
  }
};
const getUserProfileDetail = async function (uid) {
  try {
    const connection = await get_connection_from_pool();
    const sqlQuery = `SELECT first_name,last_name,profile_pic,status,uid,phone,doj,dob,email from ${userProfile} where uid=?`;
    const data = await do_query(connection, sqlQuery, [uid]);
    await connection.release();
    if (data.length !== 0) {
      let {
        first_name,
        last_name,
        profile_pic,
        status,
        phone,
        doj,
        dob,
        email,
      } = data[0];
      phone = phone?.split(",");
      doj = Date(doj);
      const result1 = {
        first_name,
        last_name,
        profile_pic,
        status,
        uid,
        phone,
        doj,
        dob,
        email,
      };
      return resultObject(
        1,
        "Success: successfully collected the profile details of user",
        [result1]
      );
    } else {
      return resultObject(1, "Success: could find user having such id", []);
    }
  } catch (error) {
    writeErrToFile({
      when: "while getting user profile details!",
      where: "getUserProfileDetail()",
      error: error.message,
    });
    return resultObject(
      0,
      "Failed: something went wrong in getting user profile details",
      []
    );
  }
};
module.exports = {
  getUserProfileDetail,
  getUserProfilePic,
  getUserStatus,
  getUserDateOfBirth,
  getUserEmail,
  getUserPhones,
  getUserName,
  getUserDateOfJoin,
};
async function temp () {
  console.log(await getUserProfilePic(1));
  console.log(await getUserStatus(1));
  console.log(await getUserDateOfJoin(1));
  console.log(await getUserEmail(1));
  console.log(await getUserPhones(1))
  console.log(await getUserName(1));
  console.log(await getUserDateOfJoin(1));
  console.log(await getUserProfileDetail(1));

}
temp()