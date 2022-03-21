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

getWallpapersFolder = () => {
    let exists = 1
    let folder = path.join(utools.getPath("pictures"), "uToolsWallpapers")
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder)
        exists = 0
    }
    return { path: folder, exists: exists }
}

MoveHistoricalWallpapers = () => {
    let wallpaperFolder = getWallpapersFolder()
    if (wallpaperFolder.exists) return
    let dest = wallpaperFolder.path
    let src = utools.getPath('temp')
    fs.readdirSync(src).forEach(f => {
        if (f.slice(0, 10) == "wallhaven-") {
            fs.copyFile(path.join(src, f), path.join(dest, f), err => { })
        }
    })
}

pluginInfo = JSON.parse(fs.readFileSync(path.join(__dirname, 'plugin.json')))


isDev = /[a-zA-Z0-9\-]+\.asar/.test(__dirname) ? false : true

GetFilePath = File => {
    if (isDev) {
        return path.join(__dirname, 'script', File)
    } else {
        return path.join(__dirname.replace(/([a-zA-Z0-9\-]+\.asar)/, '$1.unpacked'), 'script', File)
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
    } else if (utools.isWindows()) {
        var script = GetFilePath('setDesktop.cs')
        exec(`powershell -NoProfile -Command "Add-Type -Path ${script}; [Wallpaper.Setter]::SetWallpaper('${path}')"`, (err, stdout, stderr) => {
            err && utools.showNotification(stderr)
        })
    } else {
        var script = GetFilePath('set_wallpaper_linux.sh')
        exec(`bash "${script}" "${path}"`, (err, stdout, stderr) => {
            err && utools.showNotification(stderr)
        })
    }
}
