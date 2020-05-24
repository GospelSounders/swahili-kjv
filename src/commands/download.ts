import { GluegunCommand } from 'gluegun'

const NodeSwordinterface_ = require('node-sword-interface'),
  to = require('await-to-js').to;
const { Sequelize } = require('sequelize');

let interface_ = new NodeSwordinterface_();



const command: GluegunCommand = {
  name: 'download',
  description: 'download KJV bible',
  run: async toolbox => {
    if (!interface_.repositoryConfigExisting()) interface_.updateRepositoryConfig();

    let sequelize,
      username = toolbox.parameters.options.u,
      password = toolbox.parameters.options.p,
      host = toolbox.parameters.options.h || "localhost",
      moduleName = toolbox.parameters.options.m || "KJV",
      dialect = toolbox.parameters.options.d || 'sqlite',
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
      moduleLanguages = ["Eng", "Kis", "Eng", "Kis", "Eng", "Kis", "Eng", "Kis", "Eng", "Kis", "Eng", "Kis", "Eng", "Kis", "Kis", "Kis", "Kis", "Kis", "Kis", "Kis", "Kis", "Kis"],
      modulePosition = modulePositions.indexOf(moduleName),
      moduleLanguage = moduleLanguages[modulePosition]
    // Install the King James Version. It is always needed
    try {
      interface_.getLocalModule('KJV')
    } catch (err) {
      console.log('installing module KJV')
      interface_.installModule('KJV');
    }
    try {
      interface_.getLocalModule(moduleName)
    } catch (err) {
      console.log('installing module')
      interface_.installModule(moduleName);
    }

    // let booksS = interface_.getBookList('Swahili');
    // console.log(booksS); process.exit();

    // Print some module information
    // let kjv = interface_.getLocalModule('KJV');

    let books = interface_.getBookList('KJV');
    let allBooks = [].concat(books)
    books = interface_.getBookList(moduleName);
    let verseCounts = interface_.getBibleChapterVerseCounts(moduleName);

    // let listBookChapters = async (bookCode) => {
    //   // list chapters in the book
    //   return new Promise((resolve, reject) => {
    //     console.log(bookCode)
    //     resolve()
    //   })
    // }
    // console.log(books);
    // let promises = books.map(listBookChapters);
    // let [err, care] = await to(Promise.all(promises));
    // if (err) return toolbox.print.error(err);
    // console.log(care);
    // let bibleText = interface_.getBibleText('KJV');
    // console.log(bibleText)

    interface_.enableMarkup()
    // let bibleText = interface_.getBibleText('KJV');

    let formatContent = (content) => {
      content = content.replace(/&nbsp;/g, ' ')
      content = content.replace(/<div class="sword-markup sword-quote-jesus"\/>([^<]*)<\/q>/g, `{{$1}}`)
      content = content.replace(/<w class="strong:[A-Z0-9]*["]?[^>]*>([^<]*)<\/w>/g, `$1`)
      content = content.replace(/<transChange type="added">([^<]*)<\/transChange>/g, `{$1}`)
      content = content.replace(/<div class="sword-markup sword-note"  type="study"><catchWord>([^<]*)<\/catchWord>([^<]*)<rdg type="[a-z\-]*">([^<]*)<\/rdg><\/div>/g, `[$1$2$3]`)
      content = content.replace(/<rdg type="[a-z\-]*">([^<]*)<\/rdg>/g, `$1`)
      content = content.replace(/<rdg type="[a-z\-]*">([^<]*)<\/rdg>/g, `$1`)
      content = content.replace(/<rdg type="[a-z\-]*">([^<]*)<\/rdg>/g, `$1`)
      content = content.replace(/<rdg type="[a-z\-]*">([^<]*)<\/rdg>/g, `$1`)
      content = content.replace(/<rdg>([^<]*)<\/rdg>/g, `$1`)
      content = content.replace(/<rdg>([^<]*)<\/rdg>/g, `$1`)
      content = content.replace(/<rdg>([^<]*)<\/rdg>/g, `$1`)
      content = content.replace(/<rdg>([^<]*)<\/rdg>/g, `$1`)
      content = content.replace(/<div class="sword-markup sword-note"  type="study"><catchWord>([^<]*)<\/catchWord>([^<]*)<\/div>/g, `[$1$2]`)
      content = content.replace(/<div [^>]*>CHAPTER[^>]*<\/div>/g, ``)
      // content = content.replace(/<div class="sword-markup sword-milestone" marker="¶" type="x-p"\/>/g, ``) // markers
      // content = content.replace(/<div class="sword-markup sword-milestone" marker="¶" subType="x-added" type="x-p"\/>/g, ``) // markers
      // content = content.replace(/<div class="sword-markup sword-quote-jesus"\/>([^<]*)<\/q>/g, `{{$1}}`) 
      content = content.replace(/<w class[^\/]*\/>/g, ``)

      content = content.replace(/<w [^>]*>([^<]*)<\/w>/g, `$1`)
      content = content.replace(/<inscription>([^<]*)<\/inscription>/g, `[[$1]]`) // 
      content = content.replace(/<div class="sword-markup sword-section-title" canonical="true" type="psalm">([^<]*)<\/div>/g, `{{{$1}}}`) // psalm title
      // extra notes
      content = content.replace(/<div class="sword-markup sword-note"  type="study"><catchWord>[^<]*<\/catchWord>[^<]*<transChange[^>]*>[^<]*<\/transChange><\/div>/g, ``)
      content = content.replace(/<div class="sword-markup sword-section-title" type="chapter">[^>]*<\/div>/g, ``)
      content = content.replace(/<div class="sword-markup sword-note"  type="study">[^>]*<\/div>/g, ``)
      content = content.replace(/<foreign[^>]*>([^<]*)<\/foreign>/g, `(($1))`)
      content = content.replace(/<div class="sword-markup sword-quote-jesus"\/>([^<]*)<\/q>/g, `{{$1}}`)
      content = content.replace(/<div class="sword-markup sword-quote-jesus"\/><div[^>]*>([^<]*)<\/q>/g, `{{$1}}`)
      content = content.replace(/<div[^>]*>(\(\([^<]*\)\))<\/div>/g, `$1`)
      content = content.replace(/<div [^\/]*\/>/g, ``) // markers
      return content
    }

    // let chapterText = interface_.getChapterText('KJV', 'Matt', 5);
    // // // console.log(chapterText);
    // let workingText = chapterText;
    // for (let i in workingText) {
    //   let content = workingText[i].content;
    //   content = formatContent(content)
    //   workingText[i].content = content;
    //   console.log(workingText[i].absoluteVerseNr, content)
    // }
    // process.exit();


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
      // verseId: {
      //   type: Sequelize.DataTypes.INTEGER,
      //   primaryKey: true,
      //   autoIncrement: true
      // },
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
    let force = toolbox.parameters.options.f
    let [err_] = await to(sequelize.sync({ force: force }))
    if (err_) return toolbox.print.error(err_)
    // for (let i in workingText) {
    //   console.log(i)
    //   let { bibleBookShortTitle, chapter, verseNr, absoluteVerseNr, content } = workingText[i];
    //   let verseObj = {
    //     bibleBookShortTitle, chapter, verseNr, absoluteVerseNr, content,
    //     direction: "N.A",
    //     language: "Eng"
    //   }
    //   console.log(verseObj);
    //   let [err, care] = await to(verseModel.create(verseObj));
    //   if (err) return toolbox.print.error(err);
    //   care
    // }


    let saveVerse = async (verseObjIn) => {
      let { bibleBookShortTitle, chapter, verseNr, absoluteVerseNr, content } = verseObjIn;
      let bookNumber: any = allBooks.indexOf(bibleBookShortTitle);
      if (bookNumber.toString().length < 2) bookNumber = '0' + bookNumber

      let chapterWithPlaceHolder: any = chapter;
      if (chapterWithPlaceHolder.toString().length < 2) chapterWithPlaceHolder = '0' + chapterWithPlaceHolder
      if (chapterWithPlaceHolder.toString().length < 3) chapterWithPlaceHolder = '0' + chapterWithPlaceHolder

      let verseWithPlaceHolder: any = verseNr;
      if (verseWithPlaceHolder.toString().length < 2) verseWithPlaceHolder = '0' + verseWithPlaceHolder
      if (verseWithPlaceHolder.toString().length < 3) verseWithPlaceHolder = '0' + verseWithPlaceHolder


      // <rdg type="x-literal">reproached by (or, for) man</rdg>
      let verseIdRoot = `${bookNumber}-${chapterWithPlaceHolder}-${verseWithPlaceHolder}-`
      content = formatContent(content)

      let positionWithPlaceHolder: any = modulePosition
      if (positionWithPlaceHolder.toString().length < 2) positionWithPlaceHolder = '0' + positionWithPlaceHolder

      let verseObj = {
        verseId: `${verseIdRoot}-${positionWithPlaceHolder}`,
        bibleBookShortTitle, chapter, verseNr, absoluteVerseNr, content,
        direction: "N.A",
        language: moduleLanguage,
        position: modulePosition,
        moduleName
      }
      console.log(bibleBookShortTitle, verseObj.chapter, verseObj.absoluteVerseNr, content);
      let err
        ;[err] = await to(verseModel.create(verseObj));
      if (err) return toolbox.print.error(err);
      // if (modulePosition === 0) {
      //   let err
      //     ;[err] = await to(verseModel.create(verseObj));
      //   if (err) return toolbox.print.error(err);

      //   // let placeHolders = new Array(10).fill(0).map(item => JSON.parse(JSON.stringify(verseObj)));
      //   // for (let i in placeHolders) {
      //   //   // console.log(i)
      //   //   let positionWithPlaceHolder: any = parseInt(i) + 1
      //   //   if (positionWithPlaceHolder.toString().length < 2) positionWithPlaceHolder = '0' + positionWithPlaceHolder
      //   //   placeHolders[i].position = parseInt(i) + 1
      //   //   placeHolders[i].content = ''
      //   //   placeHolders[i].moduleName = ''
      //   //   placeHolders[i].language = 'Kis'
      //   //   placeHolders[i].verseId = `${verseIdRoot}-${positionWithPlaceHolder}`
      //   // }
      //   // // console.log(placeHolders)
      //   // // process.exit();
      //   // let saveEmpty = async (obj) => {
      //   //   // console.log(obj)
      //   //   await verseModel.create(obj)
      //   // }
      //   // let promises = placeHolders.map(saveEmpty)
      //   //   ;[err] = await to(Promise.all(promises));
      //   // if (err) return toolbox.print.error(err);
      // } else {

      // }
    }

    console.log(books)
    while (books.length) {
      let book = books.shift();
      /*
       * if using sqlite
       */
      switch (dialect) {
        case "sqlite": //sqlite
          let bookChapters = verseCounts;
          let chapter = -1;
          let numChapters = bookChapters[book].length;
          while (++chapter < numChapters) {
            let chapterText = interface_.getChapterText(moduleName, book, chapter + 1)
            let promises = chapterText.map(saveVerse);
            let [err] = await to(Promise.all(promises));
            if (err) return toolbox.print.error(err);
          }
          break;
        default: // maria
          let bookText = interface_.getBookText(moduleName, book)
          let promises = bookText.map(saveVerse);
          let [err] = await to(Promise.all(promises));
          if (err) return toolbox.print.error(err);
      }


    }

    sequelize.close()
  }
}

module.exports = command
