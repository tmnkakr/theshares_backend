const fse = require("fs-extra");
const config = require("../config/production.json");

const resultObject = function (success, message, data) {
  return {
    success,
    message,
    data,
  };
};
const generateResponse = function (success, message, data) {
  return {
    success,
    message,
    data,
  };
};

const writeErrToFileForArticleVerificationPanel = async (dataToWrite) =>
  new Promise(async function (resolve, reject) {
    let ts = Date.now();

    let date_ob = new Date(ts);
    let date = date_ob.getDate();
    let month = date_ob.getMonth() + 1;
    let year = date_ob.getFullYear();

    // prints date & time in YYYY-MM-DD format
    const directory = config.ErrorRelated.panels.articleVerification + "/" + year + "/" + month;
    const fileName = directory + "/" + `${date}-${month}-${year}` + ".json";
    await fse
      .ensureDir(directory)
      .then(async () => {
        //success
        await fse
          .ensureFile(fileName)
          .then(async () => {
            // success
            console.log("File created!!");
            fse.readFile(fileName, (err, data) => {
              if (err) throw err;
              let oldData;
              try {
                // WHEN file already has some data
                oldData = JSON.parse(data);
                oldData.push(dataToWrite);
                const newData = oldData;
                fse.writeFile(
                  fileName,
                  JSON.stringify(newData),
                  (err, data) => {
                    if (err) throw err;
                    console.log("Success fully added to log file 1");
                  }
                );
              } catch (error) {
                // when file don't have data
                const newData = [dataToWrite];
                fse.writeFile(
                  fileName,
                  JSON.stringify(newData),
                  (err, data) => {
                    if (err) throw err;
                    console.log("Success fully added to log file");
                  }
                );
              }
            });
          })
          .catch((error) => {
            //failed
            console.log(error);
          });

        console.log("Directory Created!!");
      })
      .catch((error) => {
        //failed
        console.log(error);
      });
  });
const writeErrToFile = async (dataToWrite) =>
  new Promise(async function (resolve, reject) {
    let ts = Date.now();

    let date_ob = new Date(ts);
    let date = date_ob.getDate();
    let month = date_ob.getMonth() + 1;
    let year = date_ob.getFullYear();

    // prints date & time in YYYY-MM-DD format
    const directory = config.ErrorRelated.directory + "/" + year + "/" + month;
    const fileName = directory + "/" + `${date}-${month}-${year}` + ".json";
    await fse
      .ensureDir(directory)
      .then(async () => {
        //success
        await fse
          .ensureFile(fileName)
          .then(async () => {
            // success
            console.log("File created!!");
            fse.readFile(fileName, (err, data) => {
              if (err) throw err;
              let oldData;
              try {
                // WHEN file already has some data
                oldData = JSON.parse(data);
                oldData.push(dataToWrite);
                const newData = oldData;
                fse.writeFile(
                  fileName,
                  JSON.stringify(newData),
                  (err, data) => {
                    if (err) throw err;
                    console.log("Success fully added to log file 1");
                  }
                );
              } catch (error) {
                // when file don't have data
                const newData = [dataToWrite];
                fse.writeFile(
                  fileName,
                  JSON.stringify(newData),
                  (err, data) => {
                    if (err) throw err;
                    console.log("Success fully added to log file");
                  }
                );
              }
            });
          })
          .catch((error) => {
            //failed
            console.log(error);
          });

        console.log("Directory Created!!");
      })
      .catch((error) => {
        //failed
        console.log(error);
      });
  });
  
//writeErrToFile({"name":"sr","class":122})
module.exports = {
  writeErrToFile,
  generateResponse,
  resultObject,
  writeErrToFileForArticleVerificationPanel
};
// console.log(encryptText('hi there'))
