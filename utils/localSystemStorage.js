const fs = require("fs");
const path = require("path");
const {
  writeErrToFile,
  resultObject,
} = require("../utils/commonUtils");

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
  const getPathOfParentDirectoryOfFile = (source) => {
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
  const getAllFilesInsideDirectory = async (source) => {
    return new Promise((resolve,reject)=>{
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
    
        resolve(resultObject(1, "Success: succcessfully distributed files", {
          mp4Files,
          pngFiles,
          jpgFiles,
          mainFile,
          configFile,
        }));
      } catch (error) {
        writeErrToFile({
          when: " while distributing files in their respective extensions",
          where: "getAllFilesInsideDirectory()",
          error: `${error.message} here stack trace was ${error.stack}`,
        });
        reject(resultObject(
          0,
          `Failed: couldn't distribute files inside directory ${source}`,
          {}
        ))
      }
    })
  };

  module.exports = {
      getAllFilesInsideDirectory,
      getFileExtension,
      getPathOfParentDirectoryOfFile,
  }