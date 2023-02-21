$(() => {

    const fs = require("fs"), win = nw.Window.get()
    var data = JSON.parse(fs.readFileSync("./data/.status.json", "utf-8"))

    // проверка наличия папки с проектами
    fs.readdir("./data/projects", err => {

        if (err) fs.mkdirSync("./data/projects")

    })

    $("#to-create-project").click(() => {

        if ($("#create-new-project input").val() === "") {

            alert("Введите имя проекта")
            return

        }

        if ($("#create-new-project input").val().length > 100) {

            alert("Слишком длинное имя")
            return

        }

        let text = $("#create-new-project input").val()
        
        text = text.replace(/\|/g, "").replace(/\\/g, "").replace(/\//g, "").replace(/\"/g, "")
            .replace(/\</g, "").replace(/\>/g, "").replace(/\?/g, "")

        if (data.projects[text]) {

            alert("Проект с таким именем уже существует")
            return

        }

        let project = {
            div: "./data/projects/" + text + "/",
            name: text
        }

        fs.mkdirSync(project.div)
        fs.writeFileSync(project.div + "index.rusl", 'вывести("Привет, мир!");')
        
        data.current.link = project.div
        data.current.project = project.name

        data.projects[project.name] = project

        fs.writeFileSync("./data/.status.json", JSON.stringify(data))
        window.location.href = "./pages/editor.html"

    })

    $("#open-project button").click(() => {
        
        $("#open-project #list").html("")

        var list = fs.readdirSync("./data/projects/")
        list.map((item, i) => {

            let stat = fs.statSync("./data/projects/"+item)
            if (!stat.isFile()) {

                $("#open-project #list").append(
                    $(`<div class='list-elm' value='${item}'>`).text(`● ${item}`).click(function() {

                        let data = JSON.parse(fs.readFileSync("./data/.status.json", "utf-8"))
                        data.current.project = $(this).attr("value")
                        data.current.link = "data/projects/"+item+'/'

                        fs.writeFileSync("./data/.status.json", JSON.stringify(data))
                        window.location.href = "./pages/editor.html"
                
                    })
                )

            }

        })

    })

    $("#update i").text(data.version)

})