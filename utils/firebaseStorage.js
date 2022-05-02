const { firebase, firebaseConfig } = require("./firebaseStuff");
firebase.initializeApp(firebaseConfig);
const {
  getStorage,
  ref, uploadBytes,
  listAll,
  deleteObject,
  getDownloadURL,
} = require("firebase/storage");
const storage = getStorage();
const {
  generateResponse,
  writeErrToFile,
  resultObject,
} = require("../utils/commonUtils");
const fs = require("fs");
const https = require("https");
const path = require("path");
const deleteDataInsideCloudDirectory = async (pathOfDirectory) => {
  return new Promise(async (resolve, reject) => {
    try {
      let successfullyRemovedAllData = true;
      // Create a reference under which you want to list
      const listRef = ref(storage, pathOfDirectory);
      // Find all the prefixes and items.
      listAll(listRef)
        .then((res) => {
          if (res.items.length) {
            res.items.forEach(async (element) => {
              // means data is available in directory on cloud
              const desertRef = ref(storage, element._location.path_);
              // Delete the file
              await deleteObject(desertRef)
                .then(() => {
                  // File deleted successfully
                  console.log(
                    `${element._location.path_} file deleted successfully`
                  );
                })
                .catch(async (error) => {
                  // Uh-oh, an error occurred!
                  successfullyRemovedAllData = false;
                  writeErrToFile({
                    when: ` while removing file  ${element._location.path_} on cloud`,
                    where: "deleteDataInsideCloudDirectory()",
                    error: `${error.message} here stack trace was ${error.stack}`,
                  });
                });
            });
            if (!successfullyRemovedAllData) {
              resolve(
                resultObject(
                  0,
                  `Failed: couldn't able to delete all files present inside directory on cloud`,
                  {}
                )
              );
            }
            resolve(
              resultObject(1, `Success: successfully deleted all files`, {
                result: successfullyRemovedAllData,
              })
            );
          } else {
            resolve(
              resultObject(
                1,
                `Success: no worrries data is not present there`,
                { result: successfullyRemovedAllData }
              )
            );
          }
        })
        .catch(async (error) => {
          // Uh-oh, an error occurred!
          writeErrToFile({
            when: `could not able to list data inside directory ${pathOfDirectory}`,
            where: "deleteDataInsideCloudDirectory()",
            error: `${error.message} here stack trace was ${error.stack}`,
          });
          reject(
            resultObject(
              0,
              `could not able to check directory -> ${pathOfDirectory} on cloud`,
              {}
            )
          );
        });
    } catch (error) {
      await writeErrToFile({
        when: " while checking wheather data exist on cloud directory or not",
        where: "deleteDataInsideCloudDirectory()",
        error: `${error.message} here stack trace was ${error.stack}`,
      });
      reject(
        resultObject(
          0,
          `could not able to check directory -> ${pathOfDirectory} on cloud`,
          {}
        )
      );
    }
  });
};
const checkIfDataExistOnCloudDirectory = async (pathOfDirectory) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Create a reference under which you want to list
      const listRef = ref(storage, pathOfDirectory);
      // Find all the prefixes and items.
      listAll(listRef)
        .then((res) => {
          if (res.items.length) {
            resolve(
              resultObject(1, `successfully checked directory on cloud`, {
                result: true,
              })
            );
          } else {
            resolve(
              resultObject(1, `successfully checked directory on cloud`, {
                result: false,
              })
            );
          }
        })
        .catch(async (error) => {
          // Uh-oh, an error occurred!
          writeErrToFile({
            when: `could not able to list data inside directory ${pathOfDirectory}`,
            where: "checkIfDataExistOnCloudDirectory()",
            error: `${error.message} here stack trace was ${error.stack}`,
          });
          reject(
            resultObject(
              0,
              `could not able to check directory -> ${pathOfDirectory} on cloud`,
              {}
            )
          );
        });
    } catch (error) {
      writeErrToFile({
        when: " while checking wheather data exist on cloud directory or not",
        where: "checkIfDataExistOnCloudDirectory()",
        error: `${error.message} here stack trace was ${error.stack}`,
      });
      reject(
        resultObject(
          0,
          `could not able to check directory -> ${pathOfDirectory} on cloud`,
          {}
        )
      );
    }
  });
};

const getDownloadableLink = async (path) => {
  return new Promise(async (resolve, reject) => {
    try {
      await getDownloadURL(ref(storage, path))
        .then((url) => {
          resolve(
            resultObject(
              1,
              `Success: successfully got downloadble link for file ${path}`,
              {
                result: url,
              }
            )
          );
        })
        .catch(async (error) => {
          throw new Error(`${error.message}`);
        });
    } catch (error) {
      console.log(error);
      reject(resultObject(0, `Failed: ${error.message}`, {}));
    }
  });
};
const helperDownload = async (url, filepath) => {
  return new Promise(async (resolve, reject) => {
    try {
      https.get(url, (res) => {
        // Image will be stored at this path
        const filePath = fs.createWriteStream(filepath);
        res.pipe(filePath);
        filePath.on("finish", () => {
          filePath.close();
          console.log("Download Completed");
          resolve(
            resultObject(
              1,
              `Success: successfully downloaded file in ${filePath}`,
              {}
            )
          );
        });
      });
    } catch (error) {
      writeErrToFile({
        when: `could not able to download file from url ${url}`,
        where: "helperDownload()",
        error: `${error.message} here stack trace was ${error.stack}`,
      });
      reject(
        resultObject(0, `Failed: couldn't download filefrom url ${url}`, {})
      );
    }
  });
};
const downloadAllFilesFromaDirectoryOnCloud = async (
  pathOfDirectory,
  localPath
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const listRef = ref(storage, pathOfDirectory);
      let element;
      let result;
      listAll(listRef)
        .then(async (res) => {
          if (res.items.length) {
            for (let i = 0; i < res.items.length; i++) {
              element = res.items[i];
              const filePathOnCloud = element._location.path_;
              const fileNameOnCloud = getFileNameFromPath(filePathOnCloud);
              const starsRef = ref(storage, filePathOnCloud);
              await getDownloadURL(starsRef)
                .then(async (url) => {
                  if (!fs.existsSync(localPath)) {
                    fs.mkdirSync(localPath,{ recursive: true });
                    console.log(`Folder Created Successfully ${localPath}.`);
                  }

                  const filePath = path.join(localPath, fileNameOnCloud);
                  result = await helperDownload(url, filePath);
                  if (result.success === 0) throw new Error(result.message);
                })
                .catch((error) => {
                  // A full list of error codes is available at
                  // https://firebase.google.com/docs/storage/web/handle-errors
                  let mainErr;
                  switch (error.code) {
                    case "storage/object-not-found":
                      // File doesn't exist
                      mainErr = `Failed: to download file from url ${url} because file not found`
                      break;
                    case "storage/unauthorized":
                      // User doesn't have permission to access the object
                      mainErr = `Failed: to download file from url ${url} because you are unauthorized`
                      break;
                    case "storage/canceled":
                      // User canceled the upload
                      mainErr=`Failed: to download file from url ${url} because file was canceled`
                      break;
                    case "storage/unknown":
                      // Unknown error occurred, inspect the server response
                      mainErr = `Failed: to download file from url ${url} because unknown error occoured`
                      break;
                  }
                  writeErrToFile({
                    when: `${mainErr} here err code was ${error.code}`,
                    where: "downloadAllFilesFromaDirectoryOnCloud()",
                    error: `${error}`,
                  });
                });

            }
            resolve(resultObject(1,`Success: successfully downloaded data into ${localPath}`,{}))
          } else {
            resolve(
              resultObject(1,
                `Success: there was no data to download!`,
                {
                })
            );
          }
        })
        .catch(async (error) => {
          // Uh-oh, an error occurred!
          console.log(error)
          writeErrToFile({
            when: `could not able to list data inside directory ${pathOfDirectory}`,
            where: "getAllFilesForAnUnverifiedArticle()",
            error: `${error}`,
          });
          reject(
            resultObject(
              0,
              `could not able to check directory -> ${pathOfDirectory} on cloud`,
              {}
            )
          );
        });
    } catch (error) {
      writeErrToFile({
        when: `could not able to list data inside directory ${pathOfDirectory}`,
        where: "getAllFilesForAnUnverifiedArticle()",
        error: `${error.message} here stack trace was ${error.stack}`,
      });
      console.log(error.message)
      reject(
        resultObject(
          0,
          `could not able to check directory -> ${pathOfDirectory} on cloud`,
          {}
        )
      );
    }
  });
};
const getAllMediaFilesDownloadLinkForAnUnverifiedArticle = async (
  pathOfDirectory
) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Create a reference under which you want to list
      const listRef = ref(storage, pathOfDirectory);
      let element;
      let mediaFiles = [];
      listAll(listRef)
        .then(async (res) => {
          if (res.items.length) {
            let temp = [];
            for (let i = 0; i < res.items.length; i++) {
              element = res.items[i];
              if (
                `${element._location.path_}`.endsWith(".png") ||
                `${element._location.path_}`.endsWith(".jpg") ||
                `${element._location.path_}`.endsWith(".jpeg") ||
                `${element._location.path_}`.endsWith(".mp4")
              ) {
                temp.push(element._location.path_);
              }
            }
            // now time to sort media
            temp = temp.sort();
            let isDataFetchedFully = true;
            let dataTemp;
            for (let i = 0; i < temp.length; i++) {
              dataTemp = await getDownloadableLink(temp[i]);
              if (dataTemp.success === 0) isDataFetchedFully = false;
              else mediaFiles.push(dataTemp.data.result);
            }
            resolve(
              resultObject(
                1,
                `Success: successfully fetched media files from cloud (underverification)`,
                {
                  isDataFetchedFully,
                  result: mediaFiles,
                }
              )
            );
          } else {
            resolve(
              1,
              `Success: successfully fetched media files from cloud (underverification)`,
              {
                isDataFetchedFully: true,
                result: [],
              }
            );
          }
        })
        .catch(async (error) => {
          // Uh-oh, an error occurred!
          writeErrToFile({
            when: `could not able to list data inside directory ${pathOfDirectory}`,
            where: "getAllFilesForAnUnverifiedArticle()",
            error: `${error.message} here stack trace was ${error.stack}`,
          });
          reject(
            resultObject(
              0,
              `could not able to check directory -> ${pathOfDirectory} on cloud`,
              {}
            )
          );
        });
    } catch (error) {
      writeErrToFile({
        when: " while checking wheather data exist on cloud directory or not",
        where: "getAllFilesForAnUnverifiedArticle()",
        error: `${error.message} here stack trace was ${error.stack}`,
      });
      reject(
        resultObject(
          0,
          `could not able to check directory -> ${pathOfDirectory} on cloud`,
          {}
        )
      );
    }
  });
};

const getFileNameFromPath = (source) => {
  let data = "";
  let shouldAdd = true;
  for (let i = source.length - 1; i > -1; i--) {
    if (shouldAdd === true && (source.charAt(i) === "/" || source.charAt(i) === "\\")) {
      shouldAdd = false;
    } else if (shouldAdd) {
      data += source.charAt(i);
    }
  }
  return data.split("").reverse().join("");
};
const uploadFilesToCloudDirectory = async (filesArr, pathOnServer, cnt) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (cnt === undefined) {
        cnt = 0;
      }
      if (filesArr.length === 0) {
        resolve(
          resultObject(1, `Success: successfully uploaded files`, {
            result: true,
            length: cnt,
            directoryPath: pathOnServer,
          })
        );
      } else {
        const element = filesArr.splice(0, 1)[0];

        const name = getFileNameFromPath(element);
        let file = fs.readFileSync(element);
        let storageRef = ref(storage, `${pathOnServer}/${name}`);
        console.log(`${pathOnServer}/${name}`,675)
        await uploadBytes(storageRef, file)
          .then(async (snapshot) => {
            cnt++;
            console.log(
              `Success: uploaded a file ${element} and name is ${name}`
            );
            resolve(await uploadFilesToCloudDirectory(filesArr, pathOnServer, cnt));
          })
          .catch((error) => {
            reject(
              resultObject(
                0,
                `Failed: couldn't upload file ${element} on server`,
                {
                  error: error,
                }
              )
            );
          });
      }
    } catch (error) {
      writeErrToFile({
        when: `could not able to upload data `,
        where: "uploadFilesToCloudDirectory()",
        error: `${error.message} here stack trace was ${error.stack}`,
      });
      reject(
        resultObject(0, `Failed: couldn't upload data on server`, {
          error: error,
        })
      );
    }
  });
};
module.exports = {
  checkIfDataExistOnCloudDirectory,
  deleteDataInsideCloudDirectory,
  getAllMediaFilesDownloadLinkForAnUnverifiedArticle,
  uploadFilesToCloudDirectory,
  downloadAllFilesFromaDirectoryOnCloud
};

async function temp() {
  
  const data = getFileNameFromPath("")
  console.log(data);
}
temp();
