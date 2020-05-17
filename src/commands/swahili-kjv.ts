import { GluegunCommand } from 'gluegun'

const chalk = require('chalk'),
  figlet = require('figlet')

const command: GluegunCommand = {
  name: 'swahili-kjv',
  run: async toolbox => {
    console.log(
      chalk.cyan(figlet.textSync('swahili-kjv', { horizontalLayout: 'full' }))
    )
    const { printHelp } = toolbox.print
    printHelp(toolbox)
  }
}

module.exports = command
