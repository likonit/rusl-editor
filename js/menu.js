$(() => {

    var win = nw.Window.get()
    win.maximize()
    win.focus()

    $("#ui-buttons #close").click(() => {
        
        win.close()

    })

    $("#ui-buttons #leaveFullscreen").click(() => {

        if (win.isFullscreen) {

            win.leaveFullscreen()
            // win.resizeTo(screen.availWidth, screen.availHeight)
            // win.setInnerWidth(screen.availWidth)
            win.maximize()

        } else {

            win.enterFullscreen()
            
        }

    })

})