$(() => {

    const fs = require("fs"), open = require("open")

    var global = {
        inComment: false,
        inString: false,
        active: false
    }

    var status = {
        current: {},
        files: []
    }

    var data = JSON.parse(fs.readFileSync("./data/.status.json", "utf-8")),
        files = [], global_files = []

    var win = nw.Window.get()
        
    // сочетание клаивш, сохранение
    // try {

    //     var shortcut = new nw.Shortcut({
    //         key : "Ctrl+S",
    //         active : function() {
    
    //             if (status.current) if (status.current.name) {

    //                 let elmt = status.files.find(item => item.name == status.current.name)
    //                 elmt.pureText = editor.getValue()
                    
    //                 loadMsg("Сохранение...")
    
    //                 fs.writeFile(status.current.name, status.current.text, err => {
    
    //                     // убираем сообщение, меняем значок на крестик
    //                     setInwork(status.current.name, "status-elm", true).removeClass("inchange").children()
    //                         .eq(1).text("×")
    //                     $("#status-loading").fadeOut(100)

    //                     status.current.inChange = false
    
    //                 })
    //             }
    //         },
    //         failed : function(msg) {
    //             nw.App.unregisterGlobalHotKey(this)
    //             console.log(msg);
    //         }
    //     })
    
    //     nw.App.registerGlobalHotKey(shortcut)

    // } catch(e) {

    //     console.log(e)
    //     chrome.runtime.reload()

    // }

    win.on('close', function () {

        // nw.App.unregisterGlobalHotKey(shortcut)
        this.close(true)

    })
    
    CodeMirror.defineMode("mymode", function() {

        var opeators = ["+", "-", ":", "=", " это ", " это не ", "!", ">", "<", "&", "|", "*", "/", " и ", " или ", ',', '.', '^', ";"],
            keyWords = ["изм", "пока", "цикл", "функция", "если", "иначе", "конец", "пропуск", "вернуть"],
            scobs = ["(", ")", '[', ']', '{', '}']
        
        return {
            startState: function() {return {inString: false};},
            token: function(stream, state) {

                var data = {
                    is: false, 
                    toRet: ""
                }

                if (!global.inString && stream.peek() == '"'){
                    stream.next();              //Skip quote
                    state.inString = true;      //Update state
                }

                if (stream.match('//') && !global.inString) {

                    stream.next();
                    global.inComment = true;

                }

                if (global.inComment && !global.inString) {

                    global.inComment = false
                    stream.skipToEnd()
                    return "comment2"
                    
                }

                if (state.inString) {

                    if (stream.skipTo('"')){    //Quote found on this line
                        stream.next();          //Skip quote
                        state.inString=false;   //Clear flag
                    } else {
                        stream.skipToEnd();     //Rest of line is string
                    }
                    return "string2";            //Token style

                } else {

                    var data = {
                        is: false, 
                        toRet: ""
                    }

                    opeators.map(item => {

                        if (stream.match(item)) {

                            data = {is: true, toRet: "operators"}

                        }

                    })

                    if (data.is) return data.toRet

                    keyWords.map(item => {

                        if (stream.match(item)) {

                            data = {is: true, toRet: "keywords"}

                        }

                    })

                    if (data.is) return data.toRet

                    scobs.map(item => {

                        if (stream.match(item)) {

                            data = {is: true, toRet: "scobs"}

                        }

                    })

                    if (data.is) return data.toRet

                    if (stream.match(/0x[a-f\d]+|[-+]?(?:\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/i)) {

                        return "numbers"
                        
                    }
                    
                    if (global.inString) return "string2"
                    stream.next();
                    return null

                }

            }

        }

    })

    // KEYMAP

    CodeMirror.keyMap.pcDefault["Ctrl-Z"] = () => {

        let elmt = status.files.find(item => item.name == status.current.name)
        elmt.text = elmt.pureText
        editor.setValue(elmt.text)

    }

    function replaceText(txt) {

        if (status.current) if (status.current.name) {

            editor.getDoc().replaceRange(txt, editor.getCursor())

        }

    }

    CodeMirror.keyMap.pcDefault["Shift-,"] = () => {

        replaceText("<")

    }

    CodeMirror.keyMap.pcDefault["Shift-."] = () => {

        replaceText(">")

    }

    CodeMirror.keyMap.pcDefault["Shift-;"] = () => {

        replaceText(";")

    }

    CodeMirror.keyMap.pcDefault["Shift-'"] = () => {

        replaceText('"')

    }

    CodeMirror.keyMap.pcDefault["Ctrl-S"] = () => {

        if (status.current) if (status.current.name) {

            let elmt = status.files.find(item => item.name == status.current.name)
            elmt.pureText = editor.getValue()
            
            loadMsg("Сохранение...")

            fs.writeFile(status.current.name, status.current.text, err => {

                // убираем сообщение, меняем значок на крестик
                setInwork(status.current.name, "status-elm", true).removeClass("inchange").children()
                    .eq(1).text("×")
                $("#status-loading").fadeOut(100)

                status.current.inChange = false

            })
        }

    }

    var editor = CodeMirror.fromTextArea(document.getElementById('rusl-code'), {
        mode: "mymode",
        lineNumbers: true,
        lineWrapping: true
    })

    editor.on("cursorActivity", function() {

        if (status.current) if (status.current.name) {

            let elmt = status.files.find(item => item.name == status.current.name)
            editor.focus()
            elmt.cursor = editor.getCursor()

        }

    })

    editor.on("change", function() {

        if (status.current) if (status.current.name) {

            let et = editor.getValue(), elmt = status.files.find(item => item.name == status.current.name)
            if (document.getElementsByClassName("status-elm").length != 0) {

                editor.focus()
                elmt.cursor = editor.getCursor()

                if (!status.current.inChange) {

                    let e = setInwork(status.current.name, "status-elm", true)
                    // проверяет, существует ли текущий объект и изменился ли текст
                    // проверяет объект, так как не всегда успевает загрузиться DOM
                    if (e && et != elmt.text) {

                        e.addClass("inchange")
                        status.current.inChange = true

                        // смена значка при наведении

                        $(".status-elm.inchange span").text("●").hover(function() {
                            
                            if ($(this).parent().hasClass("inchange")) $(this).text("×")

                        }, function() {

                            if ($(this).parent().hasClass("inchange")) $(this).text("●")

                        })

                    }

                }

            }

            elmt.text = editor.getValue()

        }

    })

    $('#workspace #files').resizable()
    $("#files #name").text(data.current.project)

    var lnk = "./data/projects/" + data.current.project + "/"

    // рекурсивное чтение проекта

    function global_push(lnk) {

        if (!global_files.find(itm => itm.name == lnk)) global_files.push({
            name: lnk,
            isActive: false
        })

    }
    
    function checkDir(link, arr) {

        if (!fs.statSync(link).isFile()) {

            fs.readdirSync(link).map(item => {

                let k = link+item
            
                if (fs.statSync(k).isFile()) {
                    
                    arr.push({
                        name: item.split('/')[item.split('/').length-1],
                        isDir: false,
                        link: k
                    })

                    global_push(k+'/')
    
                } else {
    
                    arr.push({
                        name: item.split('/')[item.split('/').length-1],
                        isDir: true,
                        files: [],
                        link: k
                    })

                    global_push(k+'/')
    
                    checkDir(k+"/", arr[arr.length-1].files)
    
                }
        
            })

        } else {

            arr.push({
                name: link.split('/')[link.split('/').length-1],
                isDir: false,
                link: link
            })

            global_push(link)
            
        }

    }

    function loadMsg(text) {

        $("#status-loading").text(text).fadeIn(100)

    }

    function setInwork(name, className, need) {

        // чтение DOM с классом className
        // при need=undefined присваиваем класс inwork
        // при need=!undefined функция используется для возвращения элемента из списка

        let elms = document.getElementsByClassName(className), curr_elm

        for (var i = 0; i < elms.length; i++) {

            if ($(elms[i]).attr("name") == name || $(elms[i]).attr("value") == name) {

                curr_elm = $(elms[i])
                break
                
            }

        }

        if (!need) curr_elm.addClass("inwork")

        return curr_elm

    }

    function renderStructure(arr, elm, i) {

        arr.map(item => {

            // создание DOM файловой системы
            
            let e = $("<div class='file-elm'>").css({
                paddingLeft: (i*6)+"px"
            }), txt = $("<a class='file-name'>").text(item.name),
                arrow = $("<img class='dir-status' src='../images/arrow.svg'>").text(">").css({
                    transform: "rotate(90deg)",
                    display: "inline-block"
                }),
                txt_block = $(`<p class='file-info' value='${item.link}'>`)

            function onclk(e, elm_) {

                if (!elm_) elm_ = $(this)
                
                let chl = elm_.parents().eq(0).children()
                if (chl.eq(1).hasClass("active")) {

                    chl.eq(0).children().eq(0).css({
                        transform: "rotate(90deg)"
                    })
                    
                    chl.eq(1).fadeOut(0).removeClass("active")
                    global_files.find(item => item.name == elm_.attr("value") + "/").isActive = false
                    
                }
                else {
                    
                    global_files.find(item => item.name == elm_.attr("value") + "/").isActive = true
                    chl.eq(1).addClass("active").fadeIn(0)
                    chl.eq(0).children().eq(0).css({
                        transform: "rotate(0deg)"
                    })

                }

            }

            if (item.isDir) {

                txt_block.append(arrow)
                txt_block.click(onclk)
                
            } else {

                txt_block.click(function() {

                    if (txt_block.hasClass("registed")) {

                        $(".file-info").removeClass("inwork")
                        $(".status-elm").removeClass("inwork")
                        $(this).addClass("inwork")

                        let name = $(this).attr("value")

                        setInwork(name, "status-elm")

                        status.current = status.files.find(item => item.name == name)
                        editor.getDoc().setValue(status.current.text)

                        return

                    }

                    $(this).addClass("registed")
                    $(".status-elm").removeClass("inwork")

                    $(".file-info").removeClass("inwork")
                    txt_block.addClass("inwork")

                    let elm = $(this)
                    loadMsg("загрузка")
                    
                    fs.readFile(elm.attr('value'), "utf8", function(err, data) {

                        // рендер элемента верхнего меню, где щас текущие файлы в работе

                        status.files.push({
                            name: elm.attr("value"),
                            text: data,
                            pureText: data,
                            cursor: {}
                        })

                        status.current = status.files[status.files.length-1]
                        
                        // отображаем редктор, убираем надпись снизу
                        $("#status-loading").fadeOut(100)

                        editor.getDoc().setValue(data)
                        $(".CodeMirror").css({
                            opacity: "1"
                        })

                        let status_elm = $("<div class='status-elm inwork'>").append($("<a>").text(elm.text()))
                            .append($("<span>").text("×").click(function() {

                                // закрытие текущего файла, удаляем из массива status.files

                                var par = $(this).parent(), l = false, deleted_name
                                status.files.map((item, i) => {

                                    if (item.name == par.attr("name")) {

                                        l = i-1
                                        if (l < 0) l = 0
                                        deleted_name = status.files[i].name
                                        status.files.splice(i, 1)

                                    }

                                })

                                par.remove()

                                if (status.files.length == 0) {

                                    $(".CodeMirror").css({
                                        opacity: "0"
                                    })

                                    status.current = {}

                                    $(".file-info").removeClass("registed")

                                } else {

                                    status.current = status.files[l]

                                    editor.getDoc().setValue(status.current.text)

                                    $(".file-info").removeClass("inwork")
                                    $(".status-elm").removeClass("inwork")

                                    setInwork(status.current.name, "status-elm")
                                    setInwork(status.current.name, "file-info")
                                    setInwork(deleted_name, "file-info", true).removeClass("registed")

                                }

                            })).attr("name", elm.attr("value")).click(function() {

                                $(".file-info").removeClass("inwork")
                                $(".status-elm").removeClass("inwork")
                                $(this).addClass("inwork")
                                
                                status.current = status.files.find(item => item.name == $(this).attr("name"))
                                let cursor = status.current.cursor

                                console.log(cursor)

                                editor.getDoc().setValue(status.current.text)
                                editor.focus()
                                editor.setCursor(cursor)

                                let name = $(this).attr("name")

                                setInwork(name, "file-info")

                                // устанавливаем курсор

                            })

                        $("#statusbar #list").append(status_elm)

                    })

                })
                
                txt.addClass("no-arrow")

            }

            txt_block.append(txt)
            e.append(txt_block)

            if (item.isDir) {
                
                let dir = $("<div class='file-dir'>").css({
                    display: "none"
                })
                e.append(dir)
                renderStructure(item.files, dir, i+1)

            }

            elm.append(e)
            
            let finded = global_files.find(itm => itm.name == item.link + "/")
            if (finded) if (finded.isActive === true) onclk(0, txt_block)

        })

    }

    function renderFileStructure() {

        $("#files #list").remove()
        $("#files").append($("<div id='list'>"))

        files = []
        checkDir(lnk, files)
        renderStructure(files, $("#files #list"), 0)

        // setTimeout(renderFileStructure, 12000)

    }

    renderFileStructure()

    function checkCorrect(val) {

        if (val.length == 0) {

            alert("Пустое поле!")
            return false

        }

        if (val.length > 100) {

            alert("Слишком длинное имя!")
            return false

        }

        return true

    }
    
    $("#files #menu #newfile").click(function() {

        showAlert($("<div>").append($("<input id='filename-input' placeholder='Имя файла'>"))
            .append($("<button id='create'>Создать</button>").click(function() {

                let val = $("#filename-input").val().replace(/\|/g, "").replace(/\\/g, "")
                .replace(/\</g, "").replace(/\>/g, "").replace(/\?/g, "").replace(/\"/g, "")

                if (!checkCorrect(val)) return

                fs.writeFile(`./data/projects/${data.current.project}/${val}`, "", err => {

                    if (err) {

                        alert("Ошибка при создании файла!")
                        return

                    }

                    renderFileStructure()
                    hideAlert()

                })

            })).append($("<p id='description'>").text("* чтобы создать файл внутри папки проекта, введите путь в формате путь/до/папки/файл - где путь локальный по отношению к проекту.")), 
            "Создать новый файл")

    })

    $("#files #menu #newfolder").click(function() {

        showAlert($("<div>").append($("<input id='filename-input' placeholder='Имя файла'>"))
            .append($("<button id='create'>Создать</button>").click(function() {

                let val = $("#filename-input").val().replace(/\|/g, "").replace(/\\/g, "")
                .replace(/\</g, "").replace(/\>/g, "").replace(/\?/g, "").replace(/\"/g, "")

                if (!checkCorrect(val)) return

                fs.mkdir(`./data/projects/${data.current.project}/${val}`, err => {

                    if (err) {

                        alert("Ошибка при создании файла!")
                        return

                    }

                    renderFileStructure()
                    hideAlert()

                })

            })).append($("<p id='description'>").text("* чтобы создать директорию внутри папки проекта, введите путь в формате путь/до/папки/файл - где путь локальный по отношению к проекту.")), 
            "Создать новую папку")

    })

    function hideAlert() {

        $("#dialog-msg").fadeOut(0)
        $("#grey-all").fadeOut(0)

    }

    function showAlert(content, txt) {

        $("#dialog-msg").css({
            display: "grid",
            opacity: 1
        })
        $("#dialog-msg #contain").remove()

        $("#dialog-msg #content h2").text(txt)
        $("#grey-all").fadeIn(0)

        $("#dialog-msg #content").append($("<div id='contain'>").append(content))

    }

    $("#dialog-msg #content #close span").click(function() {

        hideAlert()

    }) 

    $(".mini-menu-activate").click(function() {

        if ($(this).children().eq(1).eq(0).hasClass("active")) 
            $(this).children().eq(1).eq(0).fadeOut(0).removeClass("active")
        else $(this).children().eq(1).eq(0).fadeIn(0).addClass("active")

    })

    $("#project-run").click(() => {

        let ph = process.execPath.split("\\"), t = ""
        ph.pop()
        ph.map(item => t += item + "/")

        var child_process = require('child_process')
        // child_process.exec(`start cmd.exe /K cd /d ${t+data.current.link} && node src/js/rusl.js "${status.current.name}" "${t}"`, err => {

        //     console.log(err)
        // })

        child_process.exec(`start cmd.exe /K node src/js/rusl.js "${status.current.name}" "${t}"`)

    })

    $("#project-path").click(function() {

        let ph = process.execPath.split("\\"), t = ""
        ph.pop()
        ph.map(item => t += item + "/")
        
        let txt = "cd /d " + '"' + t+data.current.link + '"'
        navigator.clipboard.writeText(txt)

    })

    $("#open-project").click(function() {

        require('child_process').exec(`start "" ${data.current.link.replace(/\//g, "\\")}`)

    })

    $("#project-reload").click(() => {

        location.reload()
 
    })

    $("#project-delete").click(() => {

        showAlert($("<div>").append($("<button id='create'>Удалить</button>").click(function() {

                fs.rmdirSync(data.current.link, { recursive: true })
                window.location.href = "../index.html"

            })), "Удалить проект?")

    })

})