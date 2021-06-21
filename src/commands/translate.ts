import { GluegunCommand } from 'gluegun'

const NodeSwordinterface_ = require('node-sword-interface'),
  to = require('await-to-js').to
const { Sequelize } = require('sequelize')

let interface_ = new NodeSwordinterface_()
const translate_ = require('@vitalets/google-translate-api')

let translateWholeVerse = async (text, fromLanguage, toLanguage) => {
  return new Promise((resolve, reject) => {
    translate_(text, { to: toLanguage, from: fromLanguage })
      .then(res => {
        resolve(res.text)
      })
      .catch(err => {
        console.error(err)
        reject(err)
      })
  })
}

let translate = async options => {
  let verse = options[0]
  let text = options[1]
  let kjvText = text.KJV
  let suvText = text.SUV
  return new Promise(async (resolve, reject) => {
    console.log('----------')
    let kjvwithSuppliedAsSupplied = await translateWholeVerse(
      kjvText,
      'en',
      'sw'
    )
    let kjvwithSuppliedAsSuppliedReverse = await translateWholeVerse(
      kjvwithSuppliedAsSupplied,
      'sw',
      'en'
    )
    let SUV = await translateWholeVerse(suvText, 'sw', 'en')
    text.KJVTr1 = kjvwithSuppliedAsSupplied
    text.KJVTr1R = kjvwithSuppliedAsSuppliedReverse
    text.SUVTr = SUV
    console.log(text)
    resolve([verse, text])
  })
}

let description = `swahili-kjv translate [-u username -p password -h host -d dialect] -b book -c chapter`
const command: GluegunCommand = {
  name: 'translate',
  description: 'translate to swahili',
  run: async toolbox => {
    if (!interface_.repositoryConfigExisting())
      interface_.updateRepositoryConfig()
    let sequelize,
      username = toolbox.parameters.options.u,
      password = toolbox.parameters.options.p,
      host = toolbox.parameters.options.h || 'localhost',
      book = toolbox.parameters.options.b,
      chapter = toolbox.parameters.options.c,
      // moduleName = toolbox.parameters.options.m || "KJV",
      dialect = toolbox.parameters.options.d || 'sqlite'
    // modulePositions = ["KJV", "Tr1", "Reverse", "Tr2", "Reverse", "Tr3", "Reverse", "Tr4", "Reverse", "Tr5", "Reverse", "Tr6", "Reverse", "Swahili", "BHN", "BHND", "BHNTLK", "NEN", "SRUV", "SRUVDC", "SUV", "TKU"],
    // moduleLanguages = ["Eng", "Kis", "Eng", "Kis", "Eng", "Kis", "Eng", "Kis", "Eng", "Kis", "Eng", "Kis", "Eng", "Kis", "Kis", "Kis", "Kis", "Kis", "Kis", "Kis", "Kis", "Kis"]
    // , modulePosition = modulePositions.indexOf(moduleName),
    // moduleLanguage = moduleLanguages[modulePosition]
    if (chapter === undefined || book === undefined) {
      return toolbox.print.error(description)
    }

    try {
      interface_.getLocalModule('KJV')
    } catch (err) {
      console.log('installing module KJV')
      interface_.installModule('KJV')
    }

    let books = interface_.getBookList('KJV')
    let allBooks = [].concat(books)

    switch (dialect) {
      case 'sqlite':
        sequelize = new Sequelize({
          dialect: 'sqlite',
          storage: '/usr/share/swahili-kjv/data/swahili-kjv.sqlite',
          logging: false
        })
        break
      case 'mariadb':
        sequelize = new Sequelize('swahili-kjv', username, password, {
          host: host,
          dialect: 'mariadb', // 'mysql' | 'mariadb' | 'postgres' | 'mssql' */
          logging: false
        })
        break
      default:
        return toolbox.print.error(`unsupported dialect ${dialect}`)
    }

    const verseModel = sequelize.define(
      'Verse',
      {
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
        }
      },
      {
        // Other model options go here
      }
    )

    // let bookPosition = 0;

    let getDifferentVersions = async options => {
      const { book, chapter, moduleName } = options
      return new Promise(async (resolve, reject) => {
        let [err, care] = await to(
          verseModel.findAll({
            attributes: ['verseNr', 'content'],
            where: {
              bibleBookShortTitle: book,
              chapter: parseInt(chapter),
              moduleName
            }
          })
        )
        if (err) return toolbox.print.error(err)
        let verses = []
        while (care.length) {
          let tmp = care.shift().dataValues
          verses.push([tmp.verseNr, tmp.content])
        }
        resolve(verses)
      })
    }

    let versions = [
      { book, chapter, moduleName: 'KJV' },
      { book, chapter, moduleName: 'SUV' }
    ]
    let promises = versions.map(getDifferentVersions)
    let [err, care] = await to(Promise.all(promises))
    // console.log(care);
    err

    let versesObj = {}
    let kjvVerses = care[0]
    for (let i in kjvVerses) {
      let verse = kjvVerses[i][0]
      let text = kjvVerses[i][1]
      versesObj[verse] = { KJV: text }
    }
    let suvVerses = care[1]
    for (let i in suvVerses) {
      let verse = suvVerses[i][0]
      let text = suvVerses[i][1]
      versesObj[verse].SUV = text
    }

    let verses = []
    for (let i in versesObj) {
      verses.push([i, versesObj[i]])
    }
    promises = verses.map(translate)
    ;[err, care] = await to(Promise.all(promises))
    console.log(care)
    // console.log(verses);
    allBooks
    // await to(translate(' The book of the generation of Jesus Christ, the son of David, the son of Abraham.'));
    sequelize.close()
  }
}

module.exports = command
