const fs = require('fs')
const path = require('path')
const { exec } = require('child_process');

pushData = (databases, data) => {
    var db = utools.db.get(databases);
    if (db) {
        utools.db.put({ _id: databases, data: data, _rev: db._rev });
    } else {
        utools.db.put({ _id: databases, data: data });
    }
}

showChangeLog = () => {
    pushData('plugin', { version: pluginInfo.version })
    var log = fs.readFileSync(path.join(__dirname,'CHANGELOG.MD'), {encoding: 'utf8'})
    if(log) utools.ubrowser.goto(log, '更新日志').run()
}

isRunningAtFirstTime = () => {
    try {
        var historyVersion = utools.db.get('plugin').data.version
        if (historyVersion != pluginInfo.version) {
            return true
        } else {
            return false
        }
    } catch (error) {
        return true
    }
}

pluginInfo = JSON.parse(fs.readFileSync(path.join(__dirname, 'plugin.json')))


isDev = /[a-zA-Z0-9\-]+\.asar/.test(__dirname) ? false : true

GetFilePath = File => {
    if (isDev) {
        return path.join(__dirname, 'script', File)
    } else {
        return path.join(__dirname.replace(/([a-zA-Z0-9\-]+\.asar)/,'$1.unpacked'), 'script', File)  
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