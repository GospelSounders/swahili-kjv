import { GluegunCommand } from 'gluegun'
const NodeSwordinterface_ = require('node-sword-interface'),
  to = require('await-to-js').to
// axios = require('axios')
const { Sequelize } = require('sequelize');
const fs = require("fs-extra");
const path = require("path");
const cheerio = require("cheerio");
// const util = require("util");
// const writeFile = util.promisify(fs.writeFile);

let interface_ = new NodeSwordinterface_();

const command: GluegunCommand = {
  name: 'extractfrommybible',
  description: 'extract Swahili Versions from my Bible',
  run: async toolbox => {
    if (!interface_.repositoryConfigExisting()) interface_.updateRepositoryConfig();

    let sequelize,
      username = toolbox.parameters.options.u,
      password = toolbox.parameters.options.p,
      host = toolbox.parameters.options.h || "localhost",
      moduleName = toolbox.parameters.options.m || "KJV",
      parentDir = toolbox.parameters.options.f || "/usr/share/swahili-kjv/data",
      dialect = toolbox.parameters.options.d || 'sqlite',
      // reverse = toolbox.parameters.options.r
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
      modulePositions = ["KJV", "Tr1", "Reverse", "Tr2", "Reverse", "Tr3", "Reverse", "Tr4", "Reverse", "Tr5", "Reverse", "Tr6", "Reverse", "Swahili", "BHN", "BHND", "BHNTLK", "NEN", "SRUV", "SRUVDC", "SUV", "TKU"],
      moduleLanguages = ["Eng", "Kis", "Eng", "Kis", "Eng", "Kis", "Eng", "Kis", "Eng", "Kis", "Eng", "Kis", "Eng", "Kis", "Kis", "Kis", "Kis", "Kis", "Kis", "Kis", "Kis", "Kis"]
      , modulePosition = modulePositions.indexOf(moduleName),
      moduleLanguage = moduleLanguages[modulePosition]

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

    parentDir = path.join(parentDir, moduleName)
    books;
    // console.log(fs.readdirSync(parentDir));
    let chapters = fs.readdirSync(parentDir)
    let chapterCount = chapters.length

    let numTestaments = 1;
    // let myBibleBooks = [...books];
    if (chapterCount === 1189) numTestaments = 2;
    let bookIndexStart = 0;
    if (numTestaments === 1) bookIndexStart += 39;
    
    switch (dialect) {
      case "sqlite":
        sequelize = new Sequelize({
          dialect: 'sqlite',
          storage: '/usr/share/swahili-kjv/data/swahili-kjv.sqlite',
          logging: false
        });
        break;
      case "mariadb":
        sequelize = new Sequelize('swahili-kjv', username, password, {
          host: host,
          dialect: 'mariadb',// 'mysql' | 'mariadb' | 'postgres' | 'mssql' */
          logging: false
        });
        break;
      default:
        return toolbox.print.error(`unsupported dialect ${dialect}`)
    }


    const verseModel = sequelize.define('Verse', {
      verseId: {
        type: Sequelize.DataTypes.STRING(16),
        primaryKey: true
      },
      bibleBookShortTitle: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false
      },
      moduleName: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false
      },
      position: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false
      },
      chapter: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false
      },
      verseNr: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false
      },
      absoluteVerseNr: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false
      },
      content: {
        type: Sequelize.DataTypes.TEXT,
        allowNull: false
      },
      direction: {
        type: Sequelize.DataTypes.ENUM('N.A', 'Forward', 'Reverse'),
        allowNull: false
      },
      language: {
        type: Sequelize.DataTypes.ENUM('Eng', 'Kis'),
        allowNull: false
      },
    }, {
      // Other model options go here
    });

    let [err_] = await to(sequelize.sync({ force: false }))
    if (err_) return toolbox.print.error(err_)

    let extractChapter = async (options) => {
      return new Promise((resolve, reject) => {
        let book = options[0];
        let chapter = options[1];

        let bookNumber = books.indexOf(book);
        if (bookNumber.toString().length < 2) bookNumber = '0' + bookNumber

        let chapterWithPlaceHolder: any = chapter;
        if (chapterWithPlaceHolder.toString().length < 2) chapterWithPlaceHolder = '0' + chapterWithPlaceHolder
        if (chapterWithPlaceHolder.toString().length < 3) chapterWithPlaceHolder = '0' + chapterWithPlaceHolder


        let chapterPath = path.join(parentDir, `${book}-${chapter}.html`)
        // console.log(book, chapter, chapterPath)
        let chapterText = fs.readFileSync(chapterPath, 'utf-8');
        let $ = cheerio.load(chapterText)

        let positionWithPlaceHolder: any = modulePosition
        if (positionWithPlaceHolder.toString().length < 2) positionWithPlaceHolder = '0' + positionWithPlaceHolder

        $('span.verse').each(async (i, element) => {
          let verseText = $(element).children('.content').text()
          let verse = parseInt($(element).children('.label').text())
          let note = $(element).children('.note').text().trim();
          if (!(isNaN(verse))) {
            let verseWithPlaceHolder: any = verse;
            if (verseWithPlaceHolder.toString().length < 2) verseWithPlaceHolder = '0' + verseWithPlaceHolder
            if (verseWithPlaceHolder.toString().length < 3) verseWithPlaceHolder = '0' + verseWithPlaceHolder

            if (note.length) verseText = `${verseText} [${note}]`
            let verseIdRoot = `${bookNumber}-${chapterWithPlaceHolder}-${verseWithPlaceHolder}-`
            console.log(`${book} verse: ${verse}, ${verseIdRoot}`)
            // console.log(verseText)
            let verseObj = {
              verseId: `${verseIdRoot}-${positionWithPlaceHolder}`,
              bibleBookShortTitle: book, chapter, verseNr: verse, absoluteVerseNr: verse, content: verseText,
              direction: "N.A",
              language: moduleLanguage,
              position: modulePosition,
              moduleName
            }
            let err
              ;[err] = await to(verseModel.create(verseObj));
            err
            resolve()
            // if (err) return toolbox.print.error(err);
          }

        })
        // console.log($('span.verse').text())
      })
    }
    // let [err, care] = await to(extractChapter(['Gen', 1]))
    // if (err) return toolbox.print.error(err);
    // care;
    bookIndexStart;
    let bookIndex = bookIndexStart - 1;
    while (++bookIndex < books.length) {
      let book = books[bookIndex];
      console.log(book)
      let bookChapters = chapters.map(chapter => {
        // let re = new RegExp(/[A-Za-z]*\-([0-9]*)\.html/)
        let re = new RegExp(`${book}\-([0-9]*)\.html`)
        // console.log(re)
        try {
          chapter = parseInt(chapter.match(re)[1])
          // console.log(chapter)
          return chapter
        } catch (err) { }

      })
      bookChapters = bookChapters.filter(chapter => chapter !== undefined)
      bookChapters = bookChapters.map(chapter => [book, chapter])
      console.log(bookChapters)
      let promises = bookChapters.map(extractChapter)
      await to(Promise.all(promises))
    }
  }
}

module.exports = command
