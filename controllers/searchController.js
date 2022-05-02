const fse = require("fs-extra");
const {
    generateResponse,
    writeErrToFile,
    resultObject,
  } = require("../utils/commonUtils");

const findArticle = async (req,res) => {
    // res.sendFile()
    const filePath = `articles/1.html`

    try{
        if(await fse.existsSync(filePath)){
            fse.readFile(filePath, 'utf8', function(err, data){
                if(err) throw new Error(`${err}`);
                // Display the file content
                
                const obj = {
                    data,
                }
                return res.send(generateResponse(1,"Successfully fetched contents",[obj]));
            });
        } else {
            throw new Error(`file having path ${filePath} doesn't exist for reading`)
        }
        
        
    } catch(error) {
        writeErrToFile({
            when: `while reading a file having path ${filePath}`,
            where: "addToUserFullDetails()",
            error: error.message,
          });
          return res.send(generateResponse(0, error.message, []));
    }
    
}
module.exports = {
    findArticle
} 