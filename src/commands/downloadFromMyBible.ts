import { GluegunCommand, filesystem } from 'gluegun'
const NodeSwordinterface_ = require('node-sword-interface'),
  to = require('await-to-js').to,
  axios = require('axios'),
  cloudscraper = require('cloudscraper');
// const { Sequelize } = require('sequelize');
// const fs = require("fs-extra");
// const util = require("util");
// const writeFile = util.promisify(fs.writeFile);

let interface_ = new NodeSwordinterface_();



const command: GluegunCommand = {
  name: 'downloadfrommybible',
  description: 'download Swahili Versions from my Bible',
  run: async toolbox => {
    if (!interface_.repositoryConfigExisting()) interface_.updateRepositoryConfig();

    let
      // username = toolbox.parameters.options.u,
      // password = toolbox.parameters.options.p,
      // host = toolbox.parameters.options.h || "localhost",
      moduleName = toolbox.parameters.options.m || "KJV",
      // dialect = toolbox.parameters.options.d || 'sqlite',
      reverse = toolbox.parameters.options.r
    /*
        From https://www.bible.com/
        Biblia Habari Njema
        Biblia Habari Njema
        Biblia Habari Njema: Toleo la Kujifunza
        Neno: Bibilia Takatifu 2014
        Swahili Revised Union Version
        Swahili Revised Union Version
        Swahili Union Version
        Agano Jipya: Tafsiri ya Kusoma-Kwa-Urahisi

Greetings from Paul
1This letter is from Paul, a slave of God and an apostle of Jesus 
    */
    // modulePositions = ["KJV", "Tr1", "Reverse", "Tr2", "Reverse", "Tr3", "Reverse", "Tr4", "Reverse", "Tr5", "Reverse", "Tr6", "Reverse", "Swahili", "BHN", "BHND", "BHNTLK", "NEN", "SRUV", "SRUVDC", "SUV", "TKU"],
    // moduleLanguages = ["Eng", "Kis", "Eng", "Kis", "Eng", "Kis", "Eng", "Kis", "Eng", "Kis", "Eng", "Kis", "Eng", "Kis", "Kis", "Kis", "Kis", "Kis", "Kis", "Kis", "Kis", "Kis"],
    // modulePosition = modulePositions.indexOf(moduleName)
    // moduleLanguage = moduleLanguages[modulePosition]

    let books = interface_.getBookList('KJV');
    // Install the King James Version. It is always needed
    try {
      interface_.getLocalModule('KJV')
    } catch (err) {
      console.log('installing module KJV')
      interface_.installModule('KJV');
    }

    let mybibleVersions = ["BHN", "BHND", "BHNTLK", "NEN", "SRUV", "SRUVDC", "SUV", "TKU"]
    // "", "", "  ", "", "", "", "", "",
    if (!mybibleVersions.includes(moduleName)) return toolbox.print.error(`Unknown my Bible Version ${moduleName}`)

    // list the books in this Bible
    // let urls =[
    //   "https://www.bible.com/bible/74/GEN.1.BHN"
    // ]
    console.log('---1')
    let getBibleVersions = async (version) => {
      return new Promise(async (resolve, reject) => {
        // axios.get("https://www.bible.com/json/bible/versions/swh?filter=")
        //   .then(response => {
        //     response = response.data.items
        //     response = response.filter(item => item.local_abbreviation === version)
        //     resolve(response)
        //   })
        //   .catch(err => {
        //     reject(err)
        //   })
        let [err, care] = await to(cloudscraper.get(`https://www.bible.com/json/bible/versions/swh?filter=`))
        if (err) return reject(err)
        let response = care
        response = response.data.items
        response = response.filter(item => item.local_abbreviation === version)
        resolve(response)
      })
    }
    let [err, care] = await to(getBibleVersions(moduleName));
    if (err) return toolbox.print.error(err)
    let versionInfo = care[0];
    console.log(versionInfo)
    let getVersionBooks = async (versionId) => {
      return new Promise((resolve, reject) => {
        axios.get(`https://www.bible.com/json/bible/books/${versionId}?filter=`)
          .then(response => {
            response = response.data.items
            response = response.map(item => item.usfm)
            resolve(response)
          })
          .catch(err => {
            reject(err)
          })
      })
    }
      ;[err, care] = await to(getVersionBooks(versionInfo.id));
    if (err) return toolbox.print.error(err);
    console.log(care)
    let myBibleBooks = care;
    if (reverse) myBibleBooks = myBibleBooks.reverse();
    if (myBibleBooks.length > 66) myBibleBooks.splice(39, myBibleBooks.length - 66)  // remove apocrypha
    // console.log(myBibleBooks)
    // console.log(myBibleBooks.length)
    // process.exit();
    let numTestaments = myBibleBooks.length === 66 ? 2 : 1

    // myBibleBooks = [myBibleBooks[0]]; //check

    let downBibleText = async (options) => {
      // console.log(options)
      let { book, chapter, shortBookName } = options
      let version = versionInfo.id
      let url = `https://www.bible.com/bible/${version}/${book}.${chapter}.${versionInfo["local_abbreviation"]}`
      return new Promise((resolve, reject) => {
        // check if file already exists
        filesystem.dir(`/usr/share/swahili-kjv/data/${versionInfo["local_abbreviation"]}`)
        let fileName = `/usr/share/swahili-kjv/data/${versionInfo["local_abbreviation"]}/${shortBookName}-${chapter}.html`
        let fileExists = filesystem.exists(fileName);
        if (fileExists) return resolve(true)
        console.log(url)
        axios.get(url)
          .then(async response => {
            // if(response.data === '')return reject(`$url`)
            // console.log(response.data)
            // console.log(fileName)
            filesystem.writeAsync(fileName, response.data);
            // await writeFile(fileName, response.data);
            resolve(response.data)
          })
          .catch(err => {
            reject(err)
          })
      })
    }
    let onlyUnique = (value, index, self) => {
      return self.indexOf(value) === index;
    }
    let downloadBookText = async (book) => {
      return new Promise(async (resolve, reject) => {
        let bookIndex = myBibleBooks.indexOf(book);
        if (numTestaments === 1) bookIndex += 39
        let shortBookName = books[bookIndex]
        // if(shortBookName === undefined){
        //   console.log(books)
        //   console.log(bookIndex)
        //   console.log(book)
        //   console.log(myBibleBooks)
        //   console.log(myBibleBooks.length)
        //   console.log(numTestaments)
        //   process.exit()
        // }
        // process.exit()
        console.log(shortBookName)
        let bookText = interface_.getBookText('KJV', shortBookName);
        let chapters = []
        chapters = bookText.map(item => item.chapter).filter(onlyUnique)
        chapters = chapters.map(chapter => [{ book, chapter, shortBookName }][0])
        // console.log(chapters)
        // chapters = chapters[0] // check
        // console.log(chapters)
        let promises = chapters.map(downBibleText)
        let [err, care] = await to(Promise.all(promises))
        if (err) return toolbox.print.error(err);
        // console.log(care)
        resolve(care)
        // let version = versionInfo.id
        // return new Promise((resolve, reject) => {
        //   axios.get(`https://www.bible.com/bible/${versionId}/${book}.${chapter}.TKU`)
        //     .then(response => {
        //       response = response.data.items
        //       response = response.map(item => item.usfm)
        //       resolve(response)
        //     })
        //     .catch(err => {
        //       reject(err)
        //     })
        // })
      })
    }
    let promises = myBibleBooks.map(downloadBookText)
      ;[err, care] = await to(Promise.all(promises))
    if (err) return toolbox.print.error(err);
    // console.log(care)
  }
}

module.exports = command
