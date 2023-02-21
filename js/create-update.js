const tar = require("tar"), fs = require("fs")

tar.c( // создание обновления
    {
        gzip: true
    },
    ['./src']
).pipe(fs.createWriteStream('rusl-editor.tgz'))