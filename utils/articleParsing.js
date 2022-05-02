const { resolve } = require("path");
const { resultObject, writeErrToFile } = require("./commonUtils");

const sortContentsInsideMainFile = (actualData,aid) => {
    return new Promise((resolve,reject)=>{
        try{
            let keys = Object.keys(actualData)
            let temp;
            let mapping = new Map()
            for(let i=0;i<keys.length;i++){
                temp=keys[i]
                keys[i]=keys[i].replaceAll('VideoWidget',"")
                keys[i]=keys[i].replaceAll('ImageWidget',"")
                keys[i]=keys[i].replaceAll('TextWidget',"")
                mapping.set(keys[i],temp)
            }
            keys=keys.map((element)=> parseInt(element))
            keys =keys.sort()
            
            let result={};
            for(let i=0;i<keys.length;i++){
                result[mapping.get(`${keys[i]}`)] = actualData[mapping.get(`${keys[i]}`)]
            }
            resolve(resultObject(1,'Success: succesfully sorted contents of mainFile',{ result }))
        } catch (error){
            writeErrToFile({
                when: `unable to sort files inside mainFile for article having aid= ${aid}`,
                where: "sortContentInsideMainFile()",
                error: `${error.message} here stack was ${error.stack}`,
            });
            reject(resultObject(0,`Failed: couldn not able to sort data inside main file of article having aid=${aid}`,{}))
        }
    })
}

const parseData = (mainFileInObjForm,sortedLinks,aid) => {
    return new Promise((resolve,reject)=>{
        try{
            let data=''
            const widgets = Object.keys(mainFileInObjForm)
            ctr=0
            for(let i=0;i<widgets.length;i++){
                if(widgets[i].startsWith('VideoWidget') || widgets[i].startsWith('ImageWidget')){
                   data+= mainFileInObjForm[widgets[i]].replace("##$@$##",sortedLinks[ctr])
                   ctr++;
                } else {
                    data+= mainFileInObjForm[widgets[i]]
                }
            }
            resolve(resultObject(1,`Success: successfully parsed the data`,{ result: data}))
        } catch (error){
            writeErrToFile({
                when: `unable to parse data for articlle having id= ${aid}`,
                where: "parseData()",
                error: `${error.message} here stack was ${error.stack}`,
            });
            reject(resultObject(0,`Failed: failed to parse data`,{}))
        }
    })
}
module.exports = {
    sortContentsInsideMainFile,
    parseData
}