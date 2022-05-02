const fs = require("fs");
const fs_extra = require("fs-extra")
const multer = require("multer");
const {
  generateResponse,
  writeErrToFile,
  resultObject,
} = require("../utils/commonUtils");
let ctr = 0;

const isMediaInRequiredFormat = (req, file, callback) => {
  
  if (
    (file.mimetype.startsWith("image") &&
      (file.mimetype.endsWith("png") ||
        file.mimetype.endsWith("jpg") ||
        file.mimetype.endsWith("jpeg"))) ||
    (file.mimetype.startsWith("video") && file.mimetype.endsWith("mp4"))
  ) {
    callback(null, true);
  } else {
    callback(new Error("Only png,jpg images and .mp4 videos are allowed"));
  }
};
const multerConfigForMedia = multer.diskStorage({
  destination: (req, file, callback) => {
    if (!req.localSystemPathValue) {
      req.userId = 11; //TODO: Change it later
      //const randomNumber = Math.floor((Math.random() * 100000000) + 1);
      req.localSystemPathValue = `${Date.now()}@${req.userId}`;
    }
    const path = `rawArticles/${req.localSystemPathValue}`;
    if (fs.existsSync(path) && req.totalUploadedMedia === 0) {
      console.log("Directory exists.")
      fs_extra.removeSync(path)
    } else {
      console.log("Directory does not exist.")
    }
    fs.mkdirSync(path, { recursive: true });
    callback(null, `rawArticles/${req.localSystemPathValue}`);
  },
  filename: (req, file, callback) => {
    console.log(req.localSystemPathValue, 45);
    const ext = file.mimetype.split("/")[1];
    console.log(234,ctr,ext)
    callback(null, `media-${ctr}.${ext}`);
    ctr++;
    req.totalUploadedMedia++;
  },
});
const uploadForMedia = multer({
  storage: multerConfigForMedia,
  fileFilter: isMediaInRequiredFormat,
});
const uploadMedia = uploadForMedia.array("media");
const uploadMediaVerification = async (req, res) => {
  try {
    return res.send(
      generateResponse(1, "Success: successfully inserted media from editor", {
        totalUploadedMedia: req.totalUploadedMedia,
        localSystemPathValue: req.localSystemPathValue,
      })
    );
  } catch (error) {
    await writeErrToFile({
      when: "while uploading media for editor!",
      where: "uploadMediaVerification()",
      error: `${error.message} here stack trace was ${error.stack}`,
    });
    return res.send(
      generateResponse(
        0,
        "Failed: couldn't insert media in storage for editor",
        {}
      )
    );
  }
};

/**
 *
 * @param {String} data
 * @param {String} newSource
 * @returns
 */
const changeImageSource = async (data, newSource) => {
  try {
    let tempData = "";
    let ctr = 0;
    for (let i = 2; i < data.length; i++) {
      if (
        ctr === 0 &&
        data[i - 2] === "s" &&
        data[i - 1] === "r" &&
        data[i] === "c"
      ) {
        ctr += 3;
        console.log(ctr);
      } else if (tempData != "" && (data[i] === " " || data[i] === ">")) {
        break;
      } else if (ctr === 3 && data[i] !== "=" && data[i] !== " ") {
        tempData = tempData + data[i];
      }
    }
    const result = data.replaceAll(tempData, newSource);
    return resultObject(1, "Sucessfully changed image source", {
      result: result,
    });
  } catch (error) {
    await writeErrToFile({
      when: "while changing image source for article!",
      where: "changeImageSource()",
      error: `${error.message} here stack was ${error.stack}`,
    });
    return resultObject(0, "Failed to change image source", {});
  }
};
const uploadArticle = async (req, res) => {
  try {
    const mainFile = {
    }
    let temp;
    let cnt = 0;
    let element;
    for(let i = 0;i<req.body.htmlFile.length;i++){
      element = req.body.htmlFile[i]
      if (
        element.typeOfWidget === "ImageWidget" ||
        element.typeOfWidget === "VideoWidget"
      ) {
        temp = await changeImageSource(element.data, "##$@$##");
        
        if (temp.success === 1 && temp.data.result) {
          temp = `${temp.data.result}`;
          if(element.typeOfWidget === "ImageWidget"){
            mainFile[`ImageWidget${cnt}`] = temp
          } else if(element.typeOfWidget === "VideoWidget"){
            mainFile[`VideoWidget${cnt}`] = temp
          }
        } else {
          throw new Error(
            "Something went wrong while uploading article for verification by cron"
          );
        }
      } else {

        temp = element.data;
        mainFile[`TextWidget${cnt}`] = temp
      }
      cnt++;
    };
    
    fs.writeFileSync(
      `rawArticles/${req.body.pathOnServer}/mainFile.json`,
      JSON.stringify(mainFile),
      (err) => {
        if (err) {
          console.log(err);
          res.send(
            generateResponse(0, "Failed: failed to upload content!", {})
          );
        }
      }
    );
    fs.writeFileSync(
      `rawArticles/${req.body.pathOnServer}/metaDetails.json`,
      JSON.stringify(req.body.metaDetails),
      (err) => {
        if (err) {
          console.log(err);
          res.send(
            generateResponse(0, "Failed: failed to upload content!", {})
          );
        } else {
          console.log("file written succesfully");
        }
      }
    );

    return res.send(
      generateResponse(1, "Success: successfully uploaded article!", {})
    );
  } catch (error) {
    await writeErrToFile({
      when: "while uploading article!",
      where: "uploadArticle()",
      error: `${error.message} here stack was ${error.stack}`,
    });
    return res.send(
      generateResponse(0, "Failed: could not upload article right now!", {})
    );
  }
};
// mongodb+srv://test_dev:<password>@cluster0.hbrde.mongodb.net/myFirstDatabase?retryWrites=true&w=majority
module.exports = {
  uploadMediaVerification,
  uploadMedia,
  uploadArticle,
};
