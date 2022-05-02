const { writeErrToFileForArticleVerificationPanel, resultObject } = require("../utils/commonUtils")
const { hashData } = require('../utils/privateUtils')
const { adminTable } = require('../static/tables')
const {
    get_connection_from_pool,
    do_query,
    begin_transaction,
    commit_transaction,
    rollback,
} = require("../models/dbModel");
const checkIfAdminExist = async (adminId,password) => {
    return new Promise(async (resolve, reject) => {
        const connection = await get_connection_from_pool();
        
        try {
            let result = await hashData(password)
            if (result.success === 0) throw new Error(`Failed: couln't log you in now try again later`)
            password = result.data
            const sqlQuery = `select * from ${adminTable} where admin_id=? and password=?`;
            const data = await do_query(connection, sqlQuery, [
                adminId,password
            ]);
            connection.release()
            if (data.length === 0)
                throw new Error(
                    "Failed: could n't find this admin"
                );
            
            resolve(resultObject(1, `Success: successfully searched this admin`, {adminId: data[0].admin_id,powerValue:data[0].power_value,fullName:data[0].full_name}))
        } catch (error) {
            try{
                connection.release()
            } catch(error){
                
            }
            writeErrToFileForArticleVerificationPanel({
                when: `unable to get admin having user_id(admin_id) ${adminId}`,
                where: "checkIfAdminExist()",
                error: `${error.message} here stack was ${error.stack}`,
            });
            reject(resultObject(0, `Failed: couldn't find this admin having id ${adminId}`, {}))
        }
    })
}
const addNewAdmin = async () => {

    return new Promise(async (resolve, reject) => {
        const connection = await get_connection_from_pool()
        const fullName = "Yash Mathur"
        const powerValue = 1
        let password = 'Temp123@'
        try {
            let result = await hashData(password)
            if (result.success === 0) throw new Error(`Failed: couldn't insert data now try after some time`)
            password = result.data
            const sqlQuery = `insert into ${adminTable} (full_name,power_value,password) values (?,?,?)`;
            const data = await do_query(connection, sqlQuery, [
                fullName, powerValue, password
            ]);
            connection.release()
            if (data.affectedRows === 0)
                throw new Error(
                    "Failed: data could not get inserted in unverified article's table"
                );
            console.log(data)
            console.log(`Success: you admin account has been created your user_id(Admin_id) will be ${data.insertId}`)
            resolve(resultObject(1, `Success: successfully added a ${fullName}`, {admin_id: data.insertId}))
        } catch (error) {
            writeErrToFileForArticleVerificationPanel({
                when: `unable to add new admin named ${fullName}`,
                where: "adddNewAdmin()",
                error: `${error.message} here stack was ${error.stack}`,
            });
            reject(resultObject(0, `Failed: couldn't insert a admin now try again after some time`, {}))
        }
    })
}

module.exports ={
    checkIfAdminExist,
    addNewAdmin
}
// async function temp(){
//     try{
//         const data =await addNewAdmin();
//         console.log(data)
//     } catch (e){
//         console.log(e)
//     }
// }
// temp()