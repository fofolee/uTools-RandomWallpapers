get = (url, buffer) =>
    new Promise((reslove, reject) => {
        var xhr = new XMLHttpRequest();
        if (buffer) xhr.responseType = 'arraybuffer';
        xhr.timeout = 90000;
        xhr.open('GET', url);
        xhr.send();
        xhr.onreadystatechange = () => {
            if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                    reslove(xhr.response);
                } else {
                    console.log(xhr)
                    utools.showNotification('网络请求出错，状态码：' + xhr.status)
                    reslove("")
                }
            }
        };
    })

updateImgs = () => {
    if (window.WallPapers) {
        var imgs = document.querySelectorAll('#content img')
        for (var i = 0; i < 4; i++) {
            var img = imgs[i]
            img.className = 'hide';
            img.src = window.WallPapers[i].thumbs.large
            img.onload = function () {
                this.className = 'show';
            }
        }
    }
}

fetchWallpaper = async () => {
    var url = `https://wallhaven.cc/api/v1/search?categories=${window.preferences.categories}&purity=${window.preferences.purity}&atleast=${window.preferences.atleast}&sorting=${window.preferences.sorting}&ratios=16x9&apikey=${window.preferences.apikey}&page=${window.preferences.page}`
    console.log(url)
    try {
        var response = await get(url, false)
        window.WallPapers = JSON.parse(response).data
    } catch (e) {
        console.log(e)
    }
}

fetchKeywordWallpaper = async (keyword) => {
    var url = `https://wallhaven.cc/api/v1/search?q=${keyword}&purity=${window.preferences.purity}&atleast=${window.preferences.atleast}&sorting=relevance&ratios=16x9&apikey=${window.preferences.apikey}&page=${window.preferences.page}`
    console.log(url)
    try {
        var response = await get(url, false)
        window.WallPapers = JSON.parse(response).data
    } catch (e) {
        console.log(e)
    }
}

utools.onPluginEnter(async () => {
    window.MoveHistoricalWallpapers()
    utools.setExpendHeight(480)
    if (!window.WallPapers) {
        try {
            window.preferences = utools.db.get("WallPaperPreferences").data;
        } catch (error) {
            window.preferences = {
                categories: "111",
                purity: "100",
                sorting: "random",
                atleast: "2560x1440",
                apikey: "",
                unlock: false,
                page: 1
            }
        }
        if (!window.preferences.customScript) window.preferences.customScript = {}
        if (!window.preferences.favorites) window.preferences.favorites = []
        await fetchWallpaper()
        updateImgs()
    }
})

showOptions = wallpaper => {
    Swal.fire({
        html: `
        <img style="max-width: 400px" src="${wallpaper.thumbs.large}">
        <table class="optionsTable">
        <tr>
        <td><img class="options" src="img/download.svg" onclick=downloadWallPaper()></td>
        <td><img class="options" src="img/wallpaper.svg" onclick=setWallPaper()></td>
        <td><img class="options" src="img/raw.svg" onclick=showWallPaper()></td>
        <td><img class="options" src="img/paste.svg" onclick=copyWallPaper()></td>
        <td><img class="options" src="img/collection.svg" onclick=favIf()></td>
        </tr>
        <tr>
        <td>下载</td><td>设为壁纸</td><td>原图</td><td>复制</td>
        <td id="favIf">${window.preferences.favorites.map(x => x.id).includes(wallpaper.id) ? "取消收藏" : "收藏"}</td>
        </tr>
        </table>
        `,
        footer: `[${wallpaper.file_type.split('/')[1].toUpperCase()}][${wallpaper.resolution}][${(wallpaper.file_size / 1000000).toFixed(2)}M]`,
        showConfirmButton: false,
        onBeforeOpen: () => {
            downloadImg = async () => {
                var response = await get(wallpaper.path, true)
                var img = new Uint8Array(response)
                return img
            }

            downloadWallPaper = async () => {
                var img = await downloadImg()
                var path = utools.showSaveDialog({
                    defaultPath: `${wallpaper.path.split('/').pop()}`
                })
                if (path && img) window.saveImg(path, window.toBuffer(img))
            }

            setWallPaper = async () => {
                var img = await downloadImg()
                if (img) {
                    var path = window.joinpath(window.getWallpapersFolder().path, wallpaper.path.split('/').pop())
                    window.saveImg(path, window.toBuffer(img))
                    window.setDesktop(path)
                }
            }

            showWallPaper = () => {
                utools.shellOpenExternal(wallpaper.path)
                // utools.ubrowser.goto(wallpaper.path).run()
            }

            copyWallPaper = async () => {
                var img = await downloadImg()
                if (img) {
                    utools.copyImage(img)
                    Swal.fire({
                        text: "复制完成",
                        icon: "success"
                    })
                }
            }

            favIf = () => {
                if (document.querySelector('#favIf').innerHTML == '取消收藏') {
                    preferences.favorites.splice(preferences.favorites.map(x => x.id).indexOf(wallpaper.id), 1)
                    utools.showNotification("已取消收藏")
                    document.querySelector(`#fav img[src*='${wallpaper.id}']`).remove()
                    document.querySelector('#favIf').innerHTML = '收藏'
                    Swal.close()
                } else {
                    window.preferences.favorites.push(wallpaper)
                    utools.showNotification("已收藏")
                    document.querySelector('#favIf').innerHTML = '取消收藏'
                }
                pushData("WallPaperPreferences", window.preferences)
            }
        }
    })
}

// 偏好设置
showPreferences = async () => {
    var result = await Swal.fire({
        title: "偏好设置",
        onBeforeOpen: () => {
            for (var i = 0; i < 3; i++) {
                document.querySelectorAll("input[name='categories']")[i].checked = parseInt(window.preferences.categories[i])
            }
            for (var i = 0; i < 3; i++) {
                document.querySelectorAll("input[name='purity']")[i].checked = parseInt(window.preferences.purity[i])
            }
            document.getElementById('sorting').value = window.preferences.sorting;
            document.getElementById('atleast').value = window.preferences.atleast;
            document.getElementById('apikey').value = window.preferences.apikey;
            document.getElementById('customScript').value = window.preferences.customScript[utools.getLocalId()] || ""
            var sage = document.querySelectorAll("input[name='purity']")[2];
            if (!window.preferences.unlock) sage.parentElement.style.opacity = 0;
            if (!/^[a-zA-Z0-9]{32}$/.test(window.preferences.apikey) || !window.preferences.unlock) sage.disabled = true;
            showCustomScriptHelp = () => {
                Swal.fire({ text: "你可以自定义一个脚本来用来替换本插件设置壁纸时所使用的命令，使用$file来表示壁纸的路径，例如：/home/xx/setWallpaper.sh $file" })
            }
        },
        // backdrop: '#bbb',
        html:
            `<table>
        <tr>
            <td width=20%><div class="title">风格分类</div></td>
            <td width=60%>
                <div class="pretty p-default">
                    <input type="checkbox" name="categories" />
                    <div class="state p-primary">
                        <label>普通</label>
                    </div>
                </div>
                <div class="pretty p-default">
                    <input type="checkbox" name="categories" />
                    <div class="state p-primary">
                        <label>动漫</label>
                    </div>
                </div>
                <div class="pretty p-default">
                    <input type="checkbox" name="categories" />
                    <div class="state p-primary">
                        <label>人物</label>
                    </div>
                </div>
            </td>
        </tr>
        <tr>
            <td><div class="title">图片等级</div></td>
            <td>
                <div class="pretty p-default">
                    <input type="checkbox" name="purity" />
                    <div class="state p-primary">
                        <label>正常</label>
                    </div>
                </div>
                <div class="pretty p-default">
                    <input type="checkbox" name="purity" />
                    <div class="state p-primary">
                        <label>开放</label>
                    </div>
                </div>
                <div class="pretty p-default">
                    <input type="checkbox" name="purity" />
                    <div class="state p-danger">
                        <label>贤者</label>
                    </div>
                </div>
            </td>
        </tr>
        <tr>
            <td><div class="title">排序规则</div></td>
            <td>
                <select id="sorting" class="swal2-select">
                    <option value="date_added">最近</>
                    <option value="random">随机</>
                    <option value="views">浏览量</>
                    <option value="favorites">收藏量</>
                    <option value="toplist">排行榜</>
                </select>
            </td>
        </tr>
        <tr>
            <td><div class="title">最小尺寸</div></td>
            <td>
                <select id="atleast" class="swal2-select">
                    <option value="1920x1080">1080p</>
                    <option value="2560x1440">2k</>
                    <option value="3840x2160">4k</>
                </select>
            </td>
        </tr>
        <tr>
            <td><div class="title">API KEY</div></td>
            <td>
            <input id="apikey" class="swal2-input">
            </td>
        </tr>
        <tr>
        <td><div class="title"><a href=javascript:showCustomScriptHelp()>壁纸脚本</a></div></td>
        <td>
        <input id="customScript" class="swal2-input" placeholder="无特殊需求无需配置">
        </td>
        </tr>
    </table>`,
        focusConfirm: false,
        confirmButtonText: '保存',
        preConfirm: async () => {
            var categories = "";
            for (var i of document.querySelectorAll("input[name='categories']")) {
                categories += (i.checked * 1).toString()
            }
            var purity = "";
            for (var i of document.querySelectorAll("input[name='purity']")) {
                purity += (i.checked * 1).toString()
            }
            var data = {
                categories: categories,
                purity: purity,
                sorting: document.getElementById('sorting').value,
                atleast: document.getElementById('atleast').value,
                apikey: document.getElementById('apikey').value,
                unlock: window.preferences.unlock,
                page: window.preferences.page,
                customScript: JSON.parse(JSON.stringify(window.preferences.customScript)),
                favorites: window.preferences.favorites
            }
            data.customScript[utools.getLocalId()] = document.getElementById('customScript').value
            if (JSON.stringify(window.preferences) == JSON.stringify(data)) return "";
            return data;
        }
    })
    var data = result.value;
    if (data) {
        data.page = 1;
        window.preferences = data;
        pushData("WallPaperPreferences", data);
        await fetchWallpaper()
        updateImgs()
    }
}

searchKeyword = async () => {
    var result = await Swal.fire({
        title: '输入关键词（建议英文）',
        input: 'text',
        inputAttributes: {
            autocapitalize: 'off'
        }
    })
    if (result.value) {
        await fetchKeywordWallpaper(result.value)
        if (window.WallPapers.length != 0) {
            updateImgs()
        } else {
            Swal.fire({
                text: '所给关键词未查询到内容！'
            })
        }

    }
}

showFavorites = () => {
    var selector = document.querySelector('#fav')
    document.querySelector('#closeFav').style.display = 'block'
    document.querySelectorAll("#footer img").forEach(x => x.style.display = 'none')
    selector.style.zIndex = "1"
    selector.classList.remove('hide')
    selector.classList.add('show')
    if (!window.preferences.favorites.length) {
        utools.showNotification("尚未收藏任何壁纸！")
    }
    var start = 0
    var len = 40
    updateFavorites(selector, start, len)
    selector.onscroll = function () {
        if (this.scrollHeight == this.scrollTop + this.clientHeight) {
            start += len
            updateFavorites(selector, start, len)
        }
    }
}


updateFavorites = (selector, start, len) => {
    window.preferences.favorites.slice(start, start + len).forEach(wallpaper => {
        var img = new Image()
        img.src = wallpaper.thumbs.small
        img.onclick = function () {
            showOptions(wallpaper)
        }
        selector.appendChild(img)
    })
}

closeFavorites = () => {
    var selector = document.querySelector('#fav')
    document.querySelector('#closeFav').style.display = 'none'
    document.querySelectorAll("#footer img").forEach(x => x.style.display = 'block')
    selector.classList.remove('show')
    selector.classList.add('hide')
    selector.innerHTML = ""
    selector.style.zIndex = "-1"
}


document.querySelector('#searchbykeyword').onclick = async function () {
    searchKeyword()
}

document.querySelector('#showFav').onclick = async function () {
    showFavorites()
}

document.querySelector('#closeFav').onclick = async function () {
    closeFavorites()
}

document.querySelector('#givemefour').onclick = async function () {
    if (window.WallPapers.length >= 8) {
        window.preferences.historyPapers = window.WallPapers.slice(0, 4)
        window.WallPapers = window.WallPapers.slice(4)
    } else {
        window.preferences.historyPapers = window.WallPapers.slice(window.WallPapers.length - 4)
        window.preferences.page += 1
        await fetchWallpaper()
    }
    document.getElementById('givemefourback').style.display = 'block'
    updateImgs()
}

document.querySelector('#givemefourback').onclick = async function () {
    if (window.preferences.historyPapers) {
        window.WallPapers = window.preferences.historyPapers.concat(window.WallPapers)
        window.preferences.historyPapers = ""
        document.getElementById('givemefourback').style.display = 'none'
        updateImgs()
    }
}

document.querySelector('#preference').onclick = function () {
    showPreferences()
}

document.querySelector('#history').onclick = function () {
    utools.shellOpenPath(window.getWallpapersFolder().path)
}

for (var i = 0; i < 4; i++) {
    var imgbox = document.querySelectorAll('#content .imgbox')[i]
    imgbox.i = i
    imgbox.onclick = function () {
        showOptions(window.WallPapers[this.i])
    }
}

document.onkeydown = e => {
    if (e.which == 85 && e.ctrlKey) {
        window.preferences.unlock = true;
        Swal.fire({
            text: '天哪，你是怎么发现这个的？'
        })
    }
}
