$(() => {

    const fs = require("fs"), https = require("https"), tar = require("tar")
    var data = JSON.parse(fs.readFileSync("./data/.status.json")), dt = []
    console.log(data)
    $("#current-version").text(data.version)

    var req = https.get('https://russlang.ru/scripts/data.json', res => {

        res.on('data', chunk => dt.push(chunk))

        res.on('error', () => {})
      
        res.on('end', () => {

            if (res.statusCode == 404) {

                console.log("Ошибка при обновлении: на вашу ОС не найдено новых версий")
                return

            }

            let t = JSON.parse(Buffer.concat(dt).toString('utf8'))
            $("#update #download").fadeIn(0)
            $("#update #download h2").text("Актуальная версия: " + t.editor_vesion)

            if (t.editor_vesion != data.version) {

                $("#to-download").fadeIn(0).click(() => {

                    loadMsg("Загрузка...")
                    let o = []
                    var req = https.get('https://russlang.ru/downloads/all/other/rusl-editor/rusl-editor.tgz', 
                    res => {

                        res.on('data', chunk => o.push(chunk))

                        res.on('error', () => {})
                    
                        res.on('end', () => {

                            if (res.statusCode == 404) {

                                console.log(res)
                                return

                            }

                            fs.writeFileSync("./data/rusl-editor.tgz", Buffer.concat(o))
                            $("#status-loading").fadeOut(100)
                            $("#to-update").fadeIn(0).click(() => {

                                loadMsg("Обновление...")

                                fs.rmSync('./src', { recursive: true, force: true });

                                fs.createReadStream('./data/rusl-editor.tgz').pipe(
                                    tar.x({
                                        strip: 1,
                                        C: './'
                                    })
                                )

                                $("#status-loading").fadeOut(100)

                            })

                        })

                    })

                    req.end()

                })

            }

        })

    })

    req.end()

    function loadMsg(text) {

        $("#status-loading").text(text).fadeIn(100)

    }

})