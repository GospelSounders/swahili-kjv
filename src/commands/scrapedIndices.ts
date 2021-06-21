import { GluegunCommand, filesystem } from 'gluegun'
// import { version } from 'punycode';
const NodeSwordinterface_ = require('node-sword-interface'),
    to = require('await-to-js').to,
    // axios = require('axios'),
    // cloudscraper = require('cloudscraper'),
    shell = require('shelljs')
// events = new (require('events'))
// const { Sequelize } = require('sequelize');
// const fs = require("fs-extra");
// const util = require("util");
// const writeFile = util.promisify(fs.writeFile);

let interface_ = new NodeSwordinterface_()

const command: GluegunCommand = {
    name: 'scrapedIndices',
    description: 'Create indices for scraped versions',
    run: async toolbox => {
        if (!interface_.repositoryConfigExisting())
            interface_.updateRepositoryConfig()
        if (!toolbox.parameters.options.k) {
            return toolbox.print.error(`kjv-swahili scrape -k path-to-ssh-key`)
        }

        let registeredVersionsinIndex: any = {}

        let myBibleRepo = 'git@github.com:GospelSounders/bible.com.git'
        let myBibleRepoDir = `/tmp/kjv-swahili`
        let key = toolbox.parameters.options.k
        const clone = async () => {
            if (toolbox.parameters.options.s) return //skip
            await shell.exec(
                `GIT_SSH_COMMAND='ssh -i ${key} -o IdentitiesOnly=yes' git clone ${myBibleRepo} ${myBibleRepoDir} || GIT_SSH_COMMAND='ssh -i ${key} -o IdentitiesOnly=yes' git pull origin master`
            )

            try {
                registeredVersionsinIndex = filesystem.read(
                    `${myBibleRepoDir}/registeredVersions.js`
                )
                registeredVersionsinIndex = JSON.parse(registeredVersionsinIndex)
            } catch (error) {
                try {
                    filesystem.write(
                        `${myBibleRepoDir}/registeredVersions.js`,
                        JSON.stringify({})
                    )
                } catch (error) { }
            }
        }
        await clone()

        let booksDirs = filesystem.subdirectories(
            `/tmp/kjv-swahili/json/bible/books/`
        )

        const getVersionInfo = async path_ => {
            return new Promise((resolve, reject) => {
                let id = path_.split('/').slice(-1)[0]
                let versionInfo: any = filesystem.read(
                    `/tmp/kjv-swahili/json/bible/versions/swh/${id}.json`
                )
                // console.log(`/tmp/kjv-swahili/bible/versions/swh/${id}.json`)
                let version = JSON.parse(versionInfo)
                versionInfo = version.version
                let versionBooks = version.versionBooks
                // console.log(versionBooks)
                let template = filesystem.read(
                    `/tmp/kjv-swahili/index.version.template.html`
                )
                // console.log(template)
                template = template.replace(
                    '{{versionInfo}}',
                    `${versionInfo.local_title} (${versionInfo.local_abbreviation})`
                )
                let linkHtml = ''
                // console.log('-------------------------------------')
                versionBooks.map(item => {
                    //   console.log('++++++++++++++++++++++')
                    linkHtml += `\n<a role="button" target="_self" class="db pb2 lh-copy yv-green link"  href="/bible/${id}/${item.usfm}.1.${versionInfo.local_abbreviation}">${item.human}</a>`
                })
                // console.log('////////////////////////////')
                // console.log('////////////////////////////')
                // console.log('////////////////////////////')
                template = template.replace('{{versionLinks}}', linkHtml)
                // console.log('\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\/')
                // console.log('\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\/')
                // console.log('\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\/')
                // console.log('\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\/')
                try {
                    console.log(`/tmp/kjv-swahili/bible/${id}/index.html`)
                    filesystem.write(`/tmp/kjv-swahili/bible/${id}/index.html`, template)
                } catch (error) {
                    console.log(error)
                }
                resolve()
                // let chapters = version.
                // template = template.replace('{{versionLinks}}', linkHtml)
            })
        }
        let promises = booksDirs.map(getVersionInfo)
        let [err, care] = await to(Promise.all(promises))
        console.log(booksDirs, err, care)

        const pushRepo = async () => {
            return new Promise(async (resolve, reject) => {
                let clone
                clone = await shell.exec(
                    `cd ${myBibleRepoDir} && git add . && git commit -m "update"`
                )
                clone = await shell.exec(
                    `cd ${myBibleRepoDir} && GIT_SSH_COMMAND='ssh -i ${key} -o IdentitiesOnly=yes' git push origin master`
                )
                if (clone.stderr.length && clone.stderr.includes('fatal:')) {
                    throw clone.stderr.length
                }
                resolve(true)
            })
        }
        await pushRepo()

        //
    }
}

module.exports = command
