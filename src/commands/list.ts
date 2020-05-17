import { GluegunCommand } from 'gluegun'

const NodeSwordinterface_ = require('node-sword-interface')
// to = require('await-to-js').to;
// const { Sequelize } = require('sequelize');

let interface_ = new NodeSwordinterface_();



const command: GluegunCommand = {
  name: 'list',
  description: 'list [-b shortBookName - c chapter]',
  run: async toolbox => {
    if (!interface_.repositoryConfigExisting()) interface_.updateRepositoryConfig();

    let 
      bookName = toolbox.parameters.options.b,
      chapter = toolbox.parameters.options.c

    // Install the King James Version. It is always needed
    try {
      interface_.getLocalModule('KJV')
    } catch (err) {
      console.log('installing module KJV')
      interface_.installModule('KJV');
    }

    let books = interface_.getBookList('KJV');
    if (!bookName) {
      console.log(books);
      process.exit();
    }
    function onlyUnique(value, index, self) {
      return self.indexOf(value) === index;
    }

    if (!books.includes(bookName)) return toolbox.print.error(`Unknown book ${bookName}`)
    let bookText = interface_.getBookText('KJV', bookName);
    let chapters = []
    chapters = bookText.map(item => item.chapter).filter(onlyUnique)
    if (!chapter) {
      console.log(chapters)
      process.exit();
    }
    if (!chapters.includes(chapter.toString())) return toolbox.print.error(`Unknown chapter ${chapter} in ${bookName}`)
    let chapterText = interface_.getChapterText('KJV', bookName, chapter);
    let verses = chapterText.map(item => item.verseNr).filter(onlyUnique)
    console.log(verses)
    process.exit();
  }
}

module.exports = command
