const { firebase, firebaseConfig } = require("../utils/firebaseStuff");
firebase.initializeApp(firebaseConfig);
const { collection, query, where, getDocs } = require("firebase/firestore");
const {
  generateResponse,
  writeErrToFile,
  writeErrToFileForArticleVerificationPanel,
  resultObject,
} = require("../utils/commonUtils");
const {
  commonPathForUnverifiedArticles,
  commonPathForPublishedArticles,
  pathForCommentsInArticle,
} = require("../utils/appConstants");
const { doc, setDoc, getFirestore, getDoc } = require("firebase/firestore");
const firestoreRef = getFirestore();
const addCommentInArticle = async (aid, senderId, senderType, message) => {
  return new Promise(async (resolve, reject) => {
    try {
      const time = Date.now();
      const randomNum = Math.floor(Math.random() * 10000 + 1);
      setDoc(
        doc(
          firestoreRef,
          `${pathForCommentsInArticle}${aid}`,
          `${time}@${senderId}@${randomNum}`
        ),
        {
          aid: aid,
          senderId: senderId,
          senderType: senderType,
          message: message,
          date: time,
        }
      )
        .then((data) => {
          resolve(
            resultObject(1, `Success: successfully added comment firestore`, {})
          );
        })
        .catch((error) => {
          console.log(error);
          writeErrToFile({
            when: " while adding article comment to firestore (underverification)",
            where: "addCommentInArticle()",
            error: `${error.message} here stack trace was ${error.stack}`,
          });
          reject(resultObject(0, `${error.message}`, {}));
        });
    } catch (error) {
      console.log(error);
      writeErrToFile({
        when: " while article comment to firestore (underverification)",
        where: "addCommentInArticle()",
        error: `${error.message} here stack trace was ${error.stack}`,
      });
      reject(resultObject(0, `${error.message}`, {}));
    }
  });
};
const getCommentsForArticleInArticleVerificationPanel = (aid) => {
  return new Promise(async (resolve,reject)=>{
    let result = []
    try{
const querySnapshot = await getDocs(collection(firestoreRef, `${pathForCommentsInArticle}${aid}`));
querySnapshot.forEach((doc) => {
  // doc.data() is never undefined for query doc snapshots
  //console.log(doc.id, " => ", doc.data());
  result.push(doc.data())
});
  resolve(resultObject(1,`Success: successfully got all comments for article having aid ${aid}`,result))
    } catch(error){
      console.log(error.message,error.stack)
      writeErrToFileForArticleVerificationPanel({
        when: `unable to get all comments for article having aid ${aid}`,
        where: "getCommentsForArticleInArticleVerificationPanel() for article verification panel",
        error: `${error.message} here stack was ${error.stack}`,
      });
      reject(resultObject(0,`Failed: couldn't able to collect comments for this article`))
    }
  })
}
const uploadUnverifiedArticleToFirestore = async (
  aid,
  mainFile,
  metaDetails
) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("fires");
      await setDoc(
        doc(firestoreRef, commonPathForUnverifiedArticles, `${aid}`),
        {
          aid: aid,
          mainFile: mainFile,
          metaDetails: metaDetails,
        }
      )
        .then((data) => {
          resolve(
            resultObject(
              1,
              `Success: successfully added article to firestore`,
              {}
            )
          );
        })
        .catch((error) => {
          throw new Error(`${error.message} here stack was ${error.stack}`);
        });
    } catch (error) {
      console.log(error);
      writeErrToFile({
        when: " while uploading article details to firestore (underverification)",
        where: "uploadUnverifiedArticleToFirestore()",
        error: `${error.message} here stack trace was ${error.stack}`,
      });
      reject(resultObject(0, `${error.message}`, {}));
    }
  });
};

const uploadVerifiedArticleToFirestore = async (
  p_aid,
  mainFile,
  metaDetails
) => {
  return new Promise(async (resolve, reject) => {
    try {
      await setDoc(
        doc(firestoreRef, commonPathForPublishedArticles, `${p_aid}`),
        {
          p_aid: p_aid,
          mainFile: mainFile,
          metaDetails: metaDetails,
        }
      )
        .then((data) => {
          resolve(
            resultObject(
              1,
              `Success: successfully added article to firestore`,
              {}
            )
          );
        })
        .catch((error) => {
          throw new Error(`${error.message} here stack was ${error.stack}`);
        });
    } catch (error) {
      console.log(error);
      writeErrToFile({
        when: " while uploading article details to firestore (underverification)",
        where: "uploadUnverifiedArticleToFirestore()",
        error: `${error.message} here stack trace was ${error.stack}`,
      });
      reject(resultObject(0, `${error.message}`, {}));
    }
  });
};
const getDataForUnverifiedArticleFromFirestore = async (aid) => {
  return new Promise(async (resolve, reject) => {
    try {
      const docRef = doc(
        firestoreRef,
        commonPathForUnverifiedArticles,
        `${aid}`
      );
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        resolve(
          resultObject(1, `Success: successfully fetched data from firestore`, {
            hasData: true,
            result: docSnap.data(),
          })
        );
      } else {
        // doc.data() will be undefined in this case
        resolve(
          resultObject(1, `Success: successfully fetched data from firestore`, {
            hasData: false,
            result: {},
          })
        );
      }
    } catch (error) {
      writeErrToFile({
        when: " while getting article deatils from firestore (underverification)",
        where: "getDataForUnverifiedArticleFromFirestore()",
        error: `${error.message} here stack trace was ${error.stack}`,
      });
      reject(resultObject(0, `${error.message}`, {}));
    }
  });
};
module.exports = {
  uploadUnverifiedArticleToFirestore,
  getDataForUnverifiedArticleFromFirestore,
  uploadVerifiedArticleToFirestore,
  addCommentInArticle,
  getCommentsForArticleInArticleVerificationPanel
};

// async function temp(){
//   const data = await getCommentsForArticleInArticleVerificationPanel(6)
//   console.log(data)
// }
// temp()
