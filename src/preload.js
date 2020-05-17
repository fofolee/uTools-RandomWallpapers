const fs = require('fs')
const path = require('path')
const { exec } = require('child_process');

isDev = /[a-zA-Z0-9\-]+\.asar/.test(__dirname) ? false : true

GetFilePath = File => {
    if (isDev) {
        return path.join(__dirname, 'script', File)
    } else {
        return path.join(__dirname.replace(/[a-zA-Z0-9\-]+\.asar/,'$1.unpacked'), 'script', File)  
    }
}

toBuffer = arraybuffer => {
    return Buffer.from(arraybuffer)
}

saveImg = (path, img) => {
    fs.writeFileSync(path, img)
}

joinpath = path.join

setDesktop = path => {
    if (utools.isMacOs()) {
        exec(`osascript -e 'tell application "System Events" to set picture of desktop 1 to "${path}"'`, (err, stdout, stderr) => {
            err && utools.showNotification(stderr)
        })
    } else if(utools.isWindows()){
        var script = GetFilePath('setDesktop.cs')
        exec(`powershell -NoProfile -Command "Add-Type -Path ${script}; [Wallpaper.Setter]::SetWallpaper('${path}', 'Stretch')"`, (err, stdout, stderr) => {
            err && utools.showNotification(stderr)
        })
    } else {
        utools.showNotification('不支持 Linux')
    }
}