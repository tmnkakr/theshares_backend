const fs = require("fs");
const path = require("path");

const { firebase, firebaseConfig } = require("../utils/firebaseStuff");

firebase.initializeApp(firebaseConfig);
// const { doc,setDoc,getFirestore } = require('firebase/firestore')
const firestoreDatabase = require("../utils/firestoreDatabase");

const { commonPathForUnverifiedArticles } = require("../utils/appConstants");
const { addUnVerifiedArticle } = require("../utils/underVerificationArticle");
let rawArticlesFolder = path.join(__dirname, "../rawArticles");

const { getStorage, ref, uploadBytes } = require("firebase/storage");
const {
  checkIfDataExistOnCloudDirectory,
  deleteDataInsideCloudDirectory,
} = require("../utils/firebaseStorage");
const storage = getStorage();

const {
  generateResponse,
  writeErrToFile,
  resultObject,
} = require("../utils/commonUtils");
const { async } = require("@firebase/util");

/**
 *
 * @param {string} fileName
 * @returns string value containing files with full path
 */
const isFile = (fileName) => {
  return fs.lstatSync(fileName).isFile();
};
/**
 * this function helps in filtering out folders in the directories
 * @param {string} name
 * @returns string value containing folders full path
 */
const isFolder = (name) => {
  return fs.lstatSync(name).isDirectory();
};
/**
 * this function checks wheather we folders or not in rawArticles directory if folder exists means we have to upload them to server for further process
 * @param {string} source
 * @returns json object
 */
const checkIfArticlesExits = async (source) => {
  try {
    const result = fs
      .readdirSync(source)
      .map((fileName) => path.join(source, fileName))
      .filter(isFolder);
    if (result.length === 0) {
      // means we don't have any folder
      return resultObject(
        1,
        "Success: Successfully checked for articles existence!",
        { result: false }
      );
    } else {
      return resultObject(
        1,
        "Success: Successfully checked for articles existence!",
        { result: true, folders: result }
      );
    }
  } catch (error) {
    await writeErrToFile({
      when: "while checking user uploaded articles for uploading to server",
      where: "checkIfArticlesExists()",
      error: `${error.message} here stack trace was ${error.stack}`,
    });
    return resultObject(
      0,
      "Failed: something went wrong in checkIfArticlesFunction()",
      {}
    );
  }
};

const getAllFilesInsideDirectory = async (source) => {
  try {
    const data = fs
      .readdirSync(source)
      .map((fileName) => path.join(source, fileName))
      .filter(isFile);
    let mp4Files = [];
    let pngFiles = [];
    let jpgFiles = [];
    let mainFile = [];
    let configFile = [];
    data.forEach((element) => {
      if (element.endsWith(".png")) pngFiles.push(element);
      else if (element.endsWith(".jpg") || element.endsWith(".jpeg"))
        jpgFiles.push(element);
      else if (element.endsWith(".mp4")) mp4Files.push(element);
      else if (element.endsWith("metaDetails.json")) configFile.push(element);
      else if (element.endsWith("mainFile.json")) mainFile.push(element);
      else console.log(`${element} can't be upload`);
    });

    return resultObject(1, "Success: succcessfully distributed files", {
      mp4Files,
      pngFiles,
      jpgFiles,
      mainFile,
      configFile,
    });
  } catch (error) {
    await writeErrToFile({
      when: " while distributing files in their respective extensions",
      where: "getAllFilesInsideDirectory()",
      error: `${error.message} here stack trace was ${error.stack}`,
    });
    return resultObject(
      0,
      `Failed: couldn't distribute files inside directory ${source}`,
      {}
    );
  }
};
/**
 * this function will sort all media according to their position
 * @param {array} arr
 * @returns sorted array
 */
const sortFilesInSequence = async (arr) => {
  try {
    let fileName;
    let imgNumber;
    let fileAsMap = new Map();
    let imgNumArray = [];
    let sortedImagesResult = [];
    arr.forEach((element) => {
      fileName = element.slice(element.lastIndexOf("\\") + 1);
      imgNumber = parseInt(
        fileName
          .replaceAll("media-", "")
          .replaceAll(".mp4", "")
          .replaceAll(".png", "")
          .replaceAll(".jpg", "")
          .replaceAll(".jpeg", "")
      );

      imgNumArray.push(imgNumber);
      fileAsMap[imgNumber] = element;
    });
    imgNumArray = imgNumArray.sort();
    imgNumArray.forEach((element) => {
      sortedImagesResult.push(fileAsMap[element]);
    });
    return resultObject(1, "Success: successfully sorted images", {
      output: sortedImagesResult,
    });
  } catch (error) {
    await writeErrToFile({
      when: " while sorting images",
      where: "sortImagesInSequence()",
      error: `${error.message} here stack trace was ${error.stack}`,
    });
    return resultObject(0, "Failed: couldn't sort images", {});
  }
};
/**
 * this function returns the extension of file passed by user
 * @param {string} source
 * @returns
 */
const getFileExtension = (source) => {
  if (source.endsWith(".jpg")) return ".jpg";
  else if (source.endsWith(".jpeg")) return ".jpeg";
  else if (source.endsWith(".png")) return ".png";
  else if (source.endsWith(".mp4")) return ".mp4";
  else if (source.endsWith(".htm")) return ".htm";
  else if (source.endsWith(".html")) return ".html";
  else if (source.endsWith(".json")) return ".json";
};

/**
 * this function takes in whole path of file on cloud and return the path without that file
 * @param {string} source
 * @returns string
 */
const getMainPathFromFullPath = (source) => {
  let data = "";
  let shouldAdd = false;
  for (let i = source.length - 1; i > -1; i--) {
    if (shouldAdd) {
      data += source.charAt(i);
    } else if (shouldAdd === false && source.charAt(i) === "/") {
      shouldAdd = true;
    }
  }

  return data.split("").reverse().join("");
};

/**
 * this is a cron function which will checks those users who have uploaded their articles for verification and this function add those user's contributed article on cloud
 */
const articleUpload = async () => {
  try {
    const ifData = await checkIfArticlesExits(rawArticlesFolder);
    if (ifData.success === 1 && ifData.data.result) {
      // means we have folders inside rawArticles folder
      ifData.data.folders.forEach(async (element) => {
        try {
          const filesInside = await getAllFilesInsideDirectory(element); //  getting all files available inside the directory
          if (filesInside.data.mainFile.length != 1)
            throw new Error(
              `Failed: either 0 or more than 1 mainFile exist in directory ${element}`
            );
          if (filesInside.data.configFile.length != 1)
            throw new Error(
              `Failed: either no or more than one config file is exist in directory ${element}`
            );
          let totalMediaFilesInStorage = [
            ...filesInside.data.pngFiles,
            ...filesInside.data.mp4Files,
            ...filesInside.data.jpgFiles,
          ].length;
          totalMediaFilesInStorage += filesInside.data.mainFile.length; // adding 1 html file also
          const mediaFiles = await sortFilesInSequence([
            ...filesInside.data.pngFiles,
            ...filesInside.data.jpgFiles,
            ...filesInside.data.mp4Files,
          ]); // sorting files in proper sequence so that they can be uploaded
          //checking wheather data is consistent or not in local storage
          if (mediaFiles.length === 0 || !filesInside.data.mainFile[0]) {
            throw new Error(
              `Failed: data is not proper in folder ${rawArticlesFolder}/${element}`
            );
          }
          const metaData = fs.readFileSync(filesInside.data.configFile[0]);
          const { articleTitle, articleTags, userId } = JSON.parse(metaData);

          const cloudPath =
            commonPathForUnverifiedArticles + `/${userId}/${articleTitle}`;
          // checking wheather data is available or not cloud directory
          const uploadResult = await addUnVerifiedArticle(
            articleTitle,
            userId,
            0,
            articleTags,
            cloudPath
          );
          if (uploadResult.success === 0) {
            throw new Error(uploadResult.message);
          }
          const cloudAvailability = await checkIfDataExistOnCloudDirectory(
            cloudPath
          );
          if (cloudAvailability.success === 0)
            throw new Error(
              `Failed: something went wrong on cloud ${cloudPath}`
            );

          if (
            cloudAvailability.success === 1 &&
            cloudAvailability.data.result
          ) {
            const res = await deleteDataInsideCloudDirectory(cloudPath);
            if (res.success === 0)
              throw new Error(
                "Failed: something went wrong in deleting data inside directory on cloud"
              );
          }
          let cnt = 0;

          let article_data_address;

          mediaFiles.data.output.push(filesInside.data.mainFile[0]); // pushing mainFile
          mediaFiles.data.output.push(filesInside.data.configFile[0]); // pushing config file
          const result = await helperUpload(
            mediaFiles.data.output,
            cnt,
            article_data_address,
            cloudPath
          ); // uploading file one by one
          if (result.success === 0) {
            throw new Error(`${result.message}`);
          }
          
          const { result: insertionResult, insertedId } = uploadResult.data;
          if (insertionResult) {
            const mainFile = JSON.parse(
              fs.readFileSync(filesInside.data.mainFile[0])
            );

            const firestoreResponse =
              await firestoreDatabase.uploadUnverifiedArticleToFirestore(
                insertedId,
                mainFile,
                JSON.parse(metaData)
              );
            if(firestoreResponse.success === 0) {
              throw new Error(`${firestoreResponse.message}`)
            }
            console.log(`Success: added data from ${element} in cloud`)
          }
        } catch (error) {
          console.log(error.message);
          writeErrToFile({
            when: " while uploading articles to cloud",
            where: "articleUpload()",
            error: `${error.message} here stack trace was ${error.stack}`,
          });
        }
      });
    }
  } catch (error) {
    console.log(error)
    writeErrToFile({
      when: " while uploading articles to cloud",
      where: "articleUpload()",
      error: `${error.message} here stack trace was ${error.stack}`,
    });
  }
};
const helperUpload = async (
  filesArr,
  cnt,
  article_data_address,
  pathOnServer
) => {
  return new Promise(async (resolve, reject) => {
    if (filesArr.length === 0) {
      resolve(
        resultObject(1, `Success: successfully uploaded all files`, {
          result: true,
          cnt: cnt,
          article_data_address: article_data_address,
        })
      );
    } else {
      const element = filesArr.splice(0, 1)[0];

      let ext = getFileExtension(element);
      let name;
      if (ext === ".json" && element.endsWith("metaDetails.json"))
        name = `metaDetails${ext}`;
      else if (ext === ".json" && element.endsWith("mainFile.json"))
        name = `mainFile${ext}`;
      else name = `media-${cnt}${ext}`;

      let file = fs.readFileSync(element);
      let storageRef = ref(storage, `${pathOnServer}/${name}`);
      await uploadBytes(storageRef, file)
        .then(async (snapshot) => {
          cnt++;
          if (!article_data_address)
            article_data_address = getMainPathFromFullPath(
              snapshot.ref.fullPath
            );
          console.log(
            `Success: uploaded a file ${element} and name is ${name}`
          );
          resolve(
            await helperUpload(
              filesArr,
              cnt,
              article_data_address,
              pathOnServer
            )
          );
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
  });
};
//TODO: remove function like getFileExtension,getMainPathFromFullPath,getAllFilesInsideDirectory,isFolder,isFile can be removed from here because they are also exist in file named utils/localSystemStorage.js
// const temp = async () => {
//   let data = articleUpload();
//   console.log(data);
// };
// temp();
