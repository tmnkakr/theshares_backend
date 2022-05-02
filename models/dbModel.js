const mysql = require('mysql')
const config = require("../config/production.json")

//const pool = mysql.createPool(config.Config.local);
const pool = mysql.createPool(config.Config.mysqlserverDbConfig);
const sqlQuery = (query, params_arr = []) => {
    return new Promise(function (resolve, reject) {
        pool.getConnection(function (err, connection) {
            if (!err) {
                connection.query(mysql.format(query, params_arr), function (err, results) {
                    connection.release();
                    if (!err) {
                        resolve(results);
                    } else {
                        reject(err);
                    }
                })
            } else {
                console.log("Nothing to do ", err);
                reject(err);
            }
        })
    });
}
function queryWithoutParams(query) {
    return new Promise(function (resolve, reject) {
        pool.getConnection(function (err, connection) {
            if (!err) {
                connection.query(query, function (err, results) {
                    connection.release()
                    if (!err) {
                        resolve(results)
                    } else {
                        reject(err)
                    }
                })
            } else {
                console.log("Nothing to do ", err);
                reject(err)
            }
        })
    })
}

const get_connection_from_pool = () => {
    return new Promise((resolve, reject) => {
        pool.getConnection(function (err, connection) {
            if (err) {
                reject(err);
            } else {
                resolve(connection);
            }
        })
    })
}

const begin_transaction = (connection) => {
    return new Promise((resolve, reject) => {
        connection.beginTransaction((err) => {
            if (err) { reject(err); }
            resolve();
        })
    })
}

const do_query = (connection, query, params_arr) => {
    return new Promise((resolve, reject) => {
        connection.query(mysql.format(query, params_arr), function (err, results) {
            if (!err) {
                resolve(results);
                // console.log(results);
            } else {
                reject(err);
            }
        })
    })
}

const rollback = async (connection) => {
    try {
        return await new Promise((resolve, reject) => {
            connection.rollback(() => {
                if (connection._pool._freeConnections.indexOf(connection) == -1) {
                    connection.release();
                }
                resolve();
            });
        });
    } catch (errRoll) {
        if (connection)
            connection.release();
    }
}


const commit_transaction = async (connection) => {
    try {
        return await new Promise((resolve, reject) => {
            connection.commit(function (err) {
                connection.release();
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
    } catch (errRoll) {
        connection.release();
    }
}

module.exports = {
    commit_transaction,
    rollback,
    do_query,
    begin_transaction,
    get_connection_from_pool,
    queryWithoutParams,
    sqlQuery,

}