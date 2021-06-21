import { GluegunCommand, filesystem } from 'gluegun'
// import { version } from 'punycode';
const NodeSwordinterface_ = require('node-sword-interface'),
    to = require('await-to-js').to,
    // axios = require('axios'),
    cloudscraper = require('cloudscraper'),
    shell = require('shelljs')
// events = new (require('events'))
// const { Sequelize } = require('sequelize');
// const fs = require("fs-extra");
// const util = require("util");
// const writeFile = util.promisify(fs.writeFile);

let interface_ = new NodeSwordinterface_()

const command: GluegunCommand = {
    name: 'scrape',
    description: 'Scrape Swahili Versions from my bible.com',
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
            // toolbox.filesystem.remove(myBibleRepoDir)
            if (toolbox.parameters.options.s) return //skip
            await shell.exec(
                `GIT_SSH_COMMAND='ssh -i ${key} -o IdentitiesOnly=yes' git clone ${myBibleRepo} ${myBibleRepoDir} || GIT_SSH_COMMAND='ssh -i ${key} -o IdentitiesOnly=yes' git pull origin master`
            )
            // if (clone.stderr.length && clone.stderr.includes('fatal:')) {
            //     // print? toolbox.print.err(clone.stderr.length)
            //     throw clone.stderr.length
            // }
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

        const getBibleVersions = async () => {
            return new Promise(async (resolve, reject) => {
                let [err, care] = await to(
                    cloudscraper.get(
                        `https://www.bible.com/json/bible/versions/swh?filter=`
                    )
                )
                    ;[err, care] = await to(
                        cloudscraper.get(
                            `https://www.bible.com/json/bible/versions/swh?filter=`
                        )
                    )
                if (err) return reject(err)
                let response: any = {}

                try {
                    response = JSON.parse(care)
                } catch (error) { }
                response = response.items
                resolve(response)
            })
        }
        let [err, care] = await to(getBibleVersions())
        if (err) return toolbox.print.error(err)
        let versions = care

        const getVersionBooks = async version => {
            return new Promise(async (resolve, reject) => {
                let versionId = version.id
                let [err, care] = await to(
                    cloudscraper.get(
                        `https://www.bible.com/json/bible/books/${versionId}?filter=`
                    )
                )
                    ;[err, care] = await to(
                        cloudscraper.get(
                            `https://www.bible.com/json/bible/books/${versionId}?filter=`
                        )
                    )
                if (err) return reject(err)
                care = {
                    version,
                    versionBooks: JSON.parse(care).items
                }
                resolve(care)
            })
        }

        let promises = versions.map(getVersionBooks)
            ;[err, care] = await to(Promise.all(promises))

        const saveList = async list => {
            //filesystem.writeAsync(fileName, response.data);
            return new Promise(async (resolve, reject) => {
                if (toolbox.parameters.options.s) return resolve() //skip
                filesystem.dir(`/tmp/kjv-swahili/json/bible/versions/swh`)
                let versionId = list.version.id
                try {
                    filesystem.write(
                        `/tmp/kjv-swahili/json/bible/versions/swh/${versionId}.json`,
                        JSON.stringify(list)
                    )
                } catch (error) { }
                resolve(care)
            })
        }
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
        let lists = care
        promises = care.map(saveList)
            ;[err, care] = await to(Promise.all(promises))
        await pushRepo()

        const filterSavedVersions = async versions => {
            const versionExists = async version => {
                return new Promise(async (resolve, reject) => {
                    return resolve(
                        filesystem.isDirectory(`${myBibleRepoDir}/${version.version.id}`)
                            ? false
                            : version
                    )
                })
            }
            return new Promise(async (resolve, reject) => {
                let promises = versions.map(versionExists)
                let [err, care] = await to(Promise.all(promises))
                if (err) return reject(err)
                resolve(care)
            })
        }
            ;[err, care] = await to(filterSavedVersions(lists))
        let unsavedVersions = care.filter(item => item !== false)

        const downloadVersion = async version => {
            // let version = unsavedVersions[versionIndex++]
            return new Promise(async (resolve, reject) => {
                if (toolbox.parameters.options.s) return resolve() //skip
                let versionId = version.version.id
                let versionBooks = version.versionBooks
                const downLoadVersionChapters = async book => {
                    return new Promise(async (resolve1, reject2) => {
                        console.log(
                            `https://www.bible.com/json/bible/books/${versionId}/${book.usfm}/chapters`
                        )
                        let [err, care] = await to(
                            cloudscraper.get(
                                `https://www.bible.com/json/bible/books/${versionId}/${book.usfm}/chapters`
                            )
                        )
                            ;[err, care] = await to(
                                cloudscraper.get(
                                    `https://www.bible.com/json/bible/books/${versionId}/${book.usfm}/chapters`
                                )
                            )
                        console.log(care, typeof care)

                        if (err) return reject(err)
                        filesystem.dir(
                            `/tmp/kjv-swahili/json/bible/books/${versionId}/${book.usfm}`
                        )
                        try {
                            care = JSON.parse(care).items
                            try {
                                filesystem.write(
                                    `/tmp/kjv-swahili/json/bible/books/${versionId}/${book.usfm}/chapters.json`,
                                    JSON.stringify(care)
                                )
                            } catch (error) { }
                        } catch (error) { }
                        resolve()
                    })
                }
                let promises = versionBooks.map(downLoadVersionChapters)
                for await (let num of promises) {
                    num
                    // console.log(num);
                }
                resolve()
            })
        }

        promises = unsavedVersions.map(downloadVersion)
        for await (let num of promises) {
            console.log(num)
        }

        await pushRepo()

        let chaptersToDownloadAtaTime = 10
        try {
            chaptersToDownloadAtaTime = parseInt(toolbox.parameters.options.n)
        } catch (error) { }
        let linksForBookChapters = []
        const downloadChapterText = async (chapter, version) => {
            return new Promise(async (resolve, reject) => {
                // check if textData already exists...
                let versionId = version.id
                filesystem.dir(`/tmp/kjv-swahili/bible/${versionId}`)
                // chapter exists and we are not forcing
                if (
                    filesystem.exists(
                        `/tmp/kjv-swahili/bible/${versionId}/${chapter.usfm}.${version.local_abbreviation}/index.html`
                    )
                ) {
                    if (!toolbox.parameters.options.f) return resolve()
                }
                // console.log(`https://www.bible.com/bible/${versionId}/${chapter.usfm}.${version.local_abbreviation}`)
                linksForBookChapters.push(
                    `https://www.bible.com/bible/${versionId}/${chapter.usfm}.${version.local_abbreviation}`
                )
                //     let [err, care] = await to(cloudscraper.get(`https://www.bible.com/bible/${versionId}/${chapter.usfm}.${version.local_abbreviation}`));
                //     ;[err, care] = await to(cloudscraper.get(`https://www.bible.com/bible/${versionId}/${chapter.usfm}.${version.local_abbreviation}`))
                //    console.log(err)
                //     if(err)return reject(err)
                //     console.log(chapter, version)
                //     console.log(care);
                //     process.exit();
                resolve()
            })
        }
        const downloadChapterGroupText = async (chapterGroup, version) => {
            return new Promise(async (resolve, reject) => {
                let promises = chapterGroup.map(chapter => {
                    downloadChapterText(chapter, version)
                })
                let [err, care] = await to(Promise.all(promises))
                if (err) reject(err)
                resolve(care)
            })
        }
        const chunk = (a, n) =>
            [...Array(Math.ceil(a.length / n))].map((_, i) =>
                a.slice(n * i, n + n * i)
            )
        const downloadBookText = async (bookDir, version) => {
            return new Promise(async (resolve, reject) => {
                version.bookDir = bookDir
                let bookChapters = filesystem.read(`${bookDir}/chapters.json`)
                bookChapters = JSON.parse(bookChapters)
                // const chunk = (a, n) => [...Array(Math.ceil(a.length / n))].map((_, i) => a.slice(n * i, n + n * i));
                let chapterGroups = chunk(bookChapters, chaptersToDownloadAtaTime)
                // console.log(chapterGroups)
                let promises = chapterGroups.map(chapterGroup => {
                    downloadChapterGroupText(chapterGroup, version)
                })
                for await (let num of promises) {
                    num
                }
                resolve()
            })
        }
        const downloadVersionText = async version => {
            return new Promise(async (resolve, reject) => {
                // if(toolbox.parameters.options.s)return resolve();//skip
                let versionId = version.version.id
                // let local_abbreviation = version.version.local_abbreviation
                // let versionBooks = version.versionBooks
                let books = filesystem.subdirectories(
                    `/tmp/kjv-swahili/json/bible/books/${versionId}/`
                )
                // console.log(books)
                let promises = books.map(bookDir => {
                    downloadBookText(bookDir, version.version)
                })
                for await (let num of promises) {
                    num
                    // console.log(num);
                }
                resolve()
            })
        }

        promises = unsavedVersions.map(downloadVersionText)
        for await (let num of promises) {
            // console.log(num);
            num
        }

        //list all chapters, then download them 10 by 10... so such and such a number by such and such a number...
        // go version by version
        console.log('........1')
        //chaptersToDownloadAtaTime

        //bible/versions/swh/id.json
        const downloadPageText = async page => {
            return new Promise(async (resolve, reject) => {
                // // check if textData already exists...
                // let versionId = version.id;
                // filesystem.dir(`/tmp/kjv-swahili/bible/${versionId}`)
                // // chapter exists and we are not forcing
                // if (filesystem.exists(`/tmp/kjv-swahili/json/bible/${versionId}/${chapter.usfm}.${version.local_abbreviation}`)) {
                //     if (!toolbox.parameters.options.f) return resolve()
                // }
                console.log({ page })
                // linksForBookChapters.push(`https://www.bible.com/bible/${versionId}/${chapter.usfm}.${version.local_abbreviation}`)
                let [err, care] = await to(cloudscraper.get(page))
                    ;[err, care] = await to(cloudscraper.get(page))
                let parts = page.split('www.bible.com').slice(-1)[0]
                // let isIntro = parts.match(/(\/[^\/]*INTRO.*)/)
                // if (isIntro) {
                //     parts = parts.replace(isIntro[0], '');
                // }
                console.log(`/tmp/kjv-swahili${parts}/index.html`)
                let id = parts.match(/\/([0-9]+)\//)
                try {
                    id = id[1]
                } catch (error) { }
                if (!registeredVersionsinIndex[id]) {
                    let versionInfo: any = filesystem.read(
                        `/tmp/kjv-swahili/json/bible/versions/swh/${id}.json`
                    )
                    // console.log(`/tmp/kjv-swahili/bible/versions/swh/${id}.json`)
                    versionInfo = JSON.parse(versionInfo).version
                    let { local_title, local_abbreviation } = versionInfo
                    registeredVersionsinIndex[id] = {
                        local_title,
                        id,
                        local_abbreviation
                    }
                    // let currentVersionInfo = {

                    // }
                    let linkHtml = ``
                    for (let i in registeredVersionsinIndex) {
                        let {
                            local_title,
                            id,
                            local_abbreviation
                        } = registeredVersionsinIndex[i]
                        linkHtml += `\n<a role="button" target="_self" class="db pb2 lh-copy yv-green link"  href="/bible/${id}">${local_title} (${local_abbreviation})</a>`
                    }
                    let template = filesystem.read(`/tmp/kjv-swahili/index.template.html`)
                    template = template.replace('{{versionLinks}}', linkHtml)
                    try {
                        filesystem.write(`/tmp/kjv-swahili/index.html`, template)
                    } catch (error) { }
                }
                //registeredVersionsinIndex
                try {
                    filesystem.write(`/tmp/kjv-swahili${parts}/index.html`, care);
                } catch (error) { }
                if (err) return reject(err)
                // console.log(care);
                // process.exit();
                resolve()
            })
        }

        let pageGroups = chunk(linksForBookChapters, chaptersToDownloadAtaTime)
        console.log('........2')
        const udp = require('dgram')
        // const buffer = require('buffer');
        const client = udp.createSocket('udp4')

        client.on('message', function (msg, info) {
            console.log('Data received from server : ' + msg.toString())
            console.log(
                'Received %d bytes from %s:%d\n',
                msg.length,
                info.address,
                info.port
            )
        })

        const server = udp.createSocket('udp4')

        // emits when any error occurs
        server.on('error', function (error) {
            console.log('Error: ' + error)
            server.close()
        })

        // emits on new datagram msg
        server.on('message', async (msg, info) => {
            console.log('going to next batch of', pageGroups.length)
            let tmpLinks = pageGroups.shift()
            promises = tmpLinks.map(downloadPageText)
            await to(Promise.all(promises))
            await pushRepo()

            //sending msg
            let data = Buffer.from('next')
            client.send(data, 2222, 'localhost', function (error) {
                if (error) {
                    client.close()
                } else {
                    console.log('Data sent !!!')
                }
            })
        })

        //emits when socket is ready and listening for datagram msgs
        server.on('listening', function () {
            var address = server.address()
            var port = address.port
            var family = address.family
            var ipaddr = address.address
            console.log('Server is listening at port' + port)
            console.log('Server ip :' + ipaddr)
            console.log('Server is IP4/IP6 : ' + family)
        })

        //emits after the socket is closed using socket.close();
        server.on('close', function () {
            console.log('Socket is closed !')
        })

        server.bind(2222)

        let data = Buffer.from('next')
        client.send(data, 2222, 'localhost', function (error) {
            if (error) {
                client.close()
            } else {
                console.log('Data sent !!!')
            }
        })
    }
}

module.exports = command
