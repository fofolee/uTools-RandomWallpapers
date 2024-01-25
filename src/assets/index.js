const jsonToUrl = (json) => {
  const urlEncodedData = Object.entries(json)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
    )
    .join('&')
  return urlEncodedData
}

const httpRequest = async (url, data = null, options = {}) =>
  new Promise((reslove, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open(data === null ? 'GET' : 'POST', url, true)
    xhr.responseType = 'arraybuffer'
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 400) {
          const contentType = xhr.getResponseHeader('content-type')
          if (
            contentType.startsWith('application/json') ||
            contentType.startsWith('text/')
          ) {
            reslove(new TextDecoder('utf-8').decode(xhr.response))
          } else {
            reslove(xhr.response)
          }
        } else {
          reject(new Error(`HTTP error! status: ${xhr.status}`))
        }
      }
    }
    xhr.send(data)
  })

const updateImgs = () => {
  if (window.WallPapers) {
    var imgs = document.querySelectorAll('#content img')
    for (var i = 0; i < 4; i++) {
      var img = imgs[i]
      img.className = 'hide'
      img.src = window.WallPapers[i].thumbs.big
      img.onload = function () {
        this.className = 'show'
      }
    }
  }
}

const baseConfig = {
  categories: {
    abstract: { name: "抽象", url: "https://alphacoders.com/abstract-wallpapers" },
    animal: { name: "动物", url: "https://alphacoders.com/animal-wallpapers" },
    anime: { name: "动漫", url: "https://alphacoders.com/anime-wallpapers" },
    artistic: { name: "艺术", url: "https://alphacoders.com/artistic-wallpapers" },
    celebrity: { name: "名人", url: "https://alphacoders.com/celebrity-wallpapers" },
    comic: { name: "漫画", url: "https://alphacoders.com/comic-wallpapers" },
    fantasy: { name: "奇幻", url: "https://alphacoders.com/fantasy-wallpapers" },
    food: { name: "美食", url: "https://alphacoders.com/food-wallpapers" },
    man_made: { name: "人造", url: "https://alphacoders.com/man-made-wallpapers" },
    humor: { name: "杂项", url: "https://alphacoders.com/humor-wallpapers" },
    movie: { name: "电影", url: "https://alphacoders.com/movie-wallpapers" },
    nature: { name: "自然", url: "https://alphacoders.com/nature-wallpapers" },
    photography: { name: "摄影", url: "https://alphacoders.com/photography-wallpapers" },
    sci_fi: { name: "科幻", url: "https://alphacoders.com/sci-fi-wallpapers" },
    sports: { name: "运动", url: "https://alphacoders.com/sports-wallpapers" },
    tv_show: { name: "电视节目", url: "https://alphacoders.com/tv-show-wallpapers" },
    vehicle: { name: "交通工具", url: "https://alphacoders.com/vehicle-wallpapers" },
    video_game: { name: "游戏", url: "https://alphacoders.com/video-game-wallpapers" },
    woman: { name: "女人", url: "https://alphacoders.com/woman-wallpapers" }
  },
  sorting: {
    search: { name: '搜索', url: 'https://wall.alphacoders.com/search.php' },
    newest_wallpapers: { name: '最近', url: "https://alphacoders.com/newest-wallpapers", },
    random: { name: '随机', url: "https://wall.alphacoders.com/random.php" },
    by_views: { name: '浏览量', url: "https://wall.alphacoders.com/by_views.php" },
    by_favorites: { name: '收藏量', url: "https://wall.alphacoders.com/by_favorites.php" },
    popular: { name: '近期排行', url: "https://alphacoders.com/popular-wallpapers" },
    by_category: { name: '按分类', url: "https://wall.alphacoders.com/by_category.php" },
  },
}


const shuffleArray = (arr) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[randomIndex]] = [arr[randomIndex], arr[i]]
  }
  return arr
}

const parseHtmlResponse = (response) => {
    response = new DOMParser().parseFromString(response, 'text/html')
    console.log("response:", response);
    let doms = Array.from(response.querySelectorAll('.thumb-container,#container_thumbs_hidden .item'))
    console.log("doms:", doms);
    let result = doms.map(
    (dom) => {
      let thumbs = {
        small: dom.querySelector('picture > :first-child')
          .srcset,
          big: dom.querySelector('picture > :last-child').src,
      }
            let thumbInfo = dom.querySelector('.thumb-info,.thumb-info-masonry').innerText
            console.log(thumbInfo);
      let imageId = dom.querySelector('a').href.split('=').pop()
      let imageType = thumbs.big.split('/').pop().split('.').pop()
      let imageFolder = thumbs.small.split('.')[0].split('//').pop()
      let imageLink = `https://initiate.alphacoders.com/download/${imageFolder}/${imageId}/${imageType}`
      return {
        id: imageId,
        thumbs: thumbs,
        path: imageLink,
        // title: thumbInfo.split('-').pop().trim(),
        resolution: /\d{3,4}x\d{3,4}/.exec(thumbInfo)?.[0],
        type: imageType,
      }
    },
  )
  return window.preferences.sorting === 'by_category'
    ? shuffleArray(result).slice(0, 8)
    : result
}

const fetchWallpaper = async () => {
  let url =
    window.preferences.sorting === "by_category"
      ? `${
          baseConfig.categories[window.preferences.categories].url
        }?page=${Math.floor(Math.random() * 200)}`
      : `${baseConfig.sorting[window.preferences.sorting].url}?page=${
          window.preferences.page
        }`;
  try {
    let response = await httpRequest(url);
    window.WallPapers = parseHtmlResponse(response);
    console.log("window.WallPapers:", window.WallPapers);
  } catch (e) {
    console.log(e);
    toastMsg(e, "error");
  }
};

const fetchKeywordWallpaper = async (keyword) => {
  try {
    let response = await httpRequest(
      `${baseConfig.sorting.search}?search=${keyword}&page=${window.preferences.page}`,
    )
    window.WallPapers = parseHtmlResponse(response)
  } catch (e) {
    console.log(e)
    toastMsg(e, 'error')
  }
}

const toastMsg = (msg, icon = 'success') => {
  Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
  }).fire({
    icon: icon,
    title: msg,
  })
}

const toggleDarkMode = () => {
  var isDark = utools.isDarkColors()
  document.querySelector('#swalTheme').href = isDark
    ? 'assets/wordpress-admin.min.css'
    : ''
}

utools.onPluginEnter(async () => {
  toggleDarkMode()
  utools.setExpendHeight(500)
  window.MoveHistoricalWallpapers()
  await wallhavenSayByeBye()
  if (!window.WallPapers) {
    await fetchWallpaper()
    updateImgs()
  }
})

const downloadImg = async (url) => {
  var response = await httpRequest(url)
  var img = new Uint8Array(response)
  if (!img || !img.length) return false
  return img
}

const setWallPaper = async (url) => {
  var filepath = window.joinpath(
    window.getWallpapersFolder().path,
    url.split('/').slice(-2).join('.'),
  )
  if (!window.exists(filepath)) {
    var img = await downloadImg(url)
    if (!img) return
    window.saveFile(filepath, window.toBuffer(img))
  }
  window.setDesktop(filepath)
}

const showOptions = (wallpaper) => {
  Swal.fire({
    html: `
        <img style="max-width: 100%" src="${wallpaper.thumbs.big}">
        <table class="optionsTable">
        <tr>
        <td><img class="options" src="img/download.svg" onclick=downloadWallPaper()></td>
        <td><img class="options" src="img/wallpaper.svg" onclick=setDesktopWallpaper()></td>
        <!--<td><img class="options" src="img/raw.svg" onclick=showWallPaper()></td>-->
        <td><img class="options" src="img/paste.svg" onclick=copyWallPaper()></td>
        <td><img class="options" src="img/collection.svg" onclick=favIf()></td>
        </tr>
        <tr>
        <td>下载</td><td>设为壁纸</td>
        <!--<td>原图</td>-->
        <td>复制</td>
        <td id="favIf">${
          window.preferences.favorites.map((x) => x.id).includes(wallpaper.id)
            ? '取消收藏'
            : '收藏'
        }</td>
        </tr>
        </table>
        `,
      footer:
          // <div style="text-align: center">${wallpaper.title}<br/>`+
          `${wallpaper.type.toUpperCase()} - ${wallpaper.resolution}</div>`,
      // + `[${(wallpaper.file_size / 1000000).toFixed(2)}M]`
    showConfirmButton: false,
    onBeforeOpen: () => {
      downloadWallPaper = async () => {
        var img = await downloadImg(wallpaper.path)
        var path = utools.showSaveDialog({
            defaultPath: `${wallpaper.path.split("/").slice(-2).join('.') }`,
        })
        if (path && img) {
          window.saveFile(path, window.toBuffer(img))
          toastMsg('下载成功')
        }
      }

      setDesktopWallpaper = async () => {
        setWallPaper(wallpaper.path)
        toastMsg('请稍候', 'info')
      }

      showWallPaper = () => {
        // utools.shellOpenExternal(wallpaper.path)
        utools.ubrowser.goto(wallpaper.path).run({
          width: 1420,
          height: 830,
        })
      }

      copyWallPaper = async () => {
        var img = await downloadImg(wallpaper.path)
        if (img) {
          utools.copyImage(img)
          toastMsg('复制完成')
        }
      }
      favIf = () => {
        if (document.querySelector('#favIf').innerHTML == '取消收藏') {
          preferences.favorites.splice(
            preferences.favorites.map((x) => x.id).indexOf(wallpaper.id),
            1,
          )
          toastMsg('已取消收藏')
          var favImg = document.querySelector(
            `#fav img[src*='${wallpaper.id}']`,
          )
          if (favImg) favImg.remove()
        } else {
          window.preferences.favorites.push(wallpaper)
          toastMsg('已收藏')
        }
        pushData('WallPaperPreferences', window.preferences)
      }
    },
  })
}

const createPreferenceSelections = (preferenceSelections) => {
  Object.keys(preferenceSelections).forEach((domId) => {
    let selectDom = document.getElementById(domId)
      let selectOptions = preferenceSelections[domId]
      for (const key in selectOptions) {
        if (selectOptions.hasOwnProperty(key)) {
        if (key === 'search') continue
        const option = document.createElement('option')
        option.value = key
        option.textContent = selectOptions[key].name
        selectDom.appendChild(option)
      }
    }
  })
}

// 偏好设置
const showPreferences = async () => {
  var result = await Swal.fire({
    title: '偏好设置',
    onBeforeOpen: () => {
      createPreferenceSelections(baseConfig)
      document.getElementById('sorting').value = window.preferences.sorting
      document.getElementById('categories').value =
        window.preferences.categories
      document.getElementById('customScript').value =
        window.preferences.customScript[utools.getLocalId()] || ''
      showCustomScriptHelp = () => {
        Swal.fire({
          text:
            '你可以自定义一个脚本来用来替换本插件设置壁纸时所使用的命令，使用$file来表示壁纸的路径，例如：/home/xx/setWallpaper.sh $file',
        })
      }
      setCategoriesStatus = () => {
        document.getElementById('categories').disabled =
          document.getElementById('sorting').value !== 'by_category'
      }
      setCategoriesStatus()
    },
    // backdrop: '#bbb',
    html: await httpRequest('./setting.html'),
    focusConfirm: false,
    confirmButtonText: '保存',
    showCancelButton: true,
    preConfirm: async () => {
      var data = {
        categories: document.getElementById('categories').value,
        sorting: document.getElementById('sorting').value,
        page: window.preferences.page,
        autoChangeTime: window.preferences.autoChangeTime,
        customScript: JSON.parse(
          JSON.stringify(window.preferences.customScript),
        ),
        favorites: window.preferences.favorites,
      }
      data.customScript[utools.getLocalId()] = document.getElementById(
        'customScript',
      ).value
      if (JSON.stringify(window.preferences) == JSON.stringify(data)) return ''
      return data
    },
  })
  var data = result.value
  if (data) {
    data.page = 1
    window.preferences = data
    pushData('WallPaperPreferences', data)
    await fetchWallpaper()
    updateImgs()
  }
}

const searchKeyword = async () => {
  var result = await Swal.fire({
    title: '搜索壁纸',
    text: '为了提升搜索结果的准确性，建议使用英文关键词',
    input: 'text',
    inputAttributes: {
      autocapitalize: 'off',
    },
  })
  if (result.value) {
    await fetchKeywordWallpaper(result.value)
    if (window.WallPapers.length != 0) {
      updateImgs()
    } else {
      toastMsg('所给关键词未查询到内容！', 'warning')
    }
  }
}

const setDesktopFromFavorite = async () => {
  var randomNumber = Math.floor(
    Math.random() * window.preferences.favorites.length,
  )
  var wallpaper = window.preferences.favorites[randomNumber].path
  console.log(wallpaper)
  setWallPaper(wallpaper)
}

const addWallpaperTimer = (time) => {
  if (window.wallpaperTimer) clearInterval(window.wallpaperTimer)
  window.wallpaperTimer = null
  if (!/^\+?[1-9][0-9]*$/.test(time)) return
  setDesktopFromFavorite()
  window.wallpaperTimer = setInterval(() => {
    setDesktopFromFavorite()
  }, time * 60 * 1000)
}

const autoChangeWallpaper = async () => {
  var result = await Swal.fire({
    title: '自动更换壁纸',
    html: `<p style="text-align: left">将每隔一段时间从收藏中随机抽取图片并设为电脑壁纸。<br>
        注意需要将插件设置为<b>『跟随主程序同时启动』</b>（2.6.1版本以上，当前版本<b>${utools.getAppVersion()}</b>${
      utools.getAppVersion() < '2.6.1'
        ? '，请到官网进行<a href=javascript:utools.shellOpenExternal("http://u.tools")>升级</a>！'
        : ''
    }），且取消<b>『隐藏后台时完全退出』</b>才能在开机后在后台自动更换。<a href="" onclick=document.getElementById("autoStartHelp").style.display='block'>设置方法</a></p><img id="autoStartHelp" style="display: none" width="100%" src="img/autoStart.jpg">
        <p>请设置时间间隔（单位：<b>分钟</b>）</p>`,
    input: 'number',
    inputValue: window.preferences.autoChangeTime,
    showCancelButton: true,
    confirmButtonText: '启用',
    cancelButtonText: '停用',
    cancelButtonColor: '#d33',
    showCloseButton: true,
  })
  if (result.dismiss) {
    if (result.dismiss != 'cancel') return
    window.preferences.autoChangeTime = null
    toastMsg('已禁用')
  } else {
    if (!parseInt(result.value)) return toastMsg('请输入大于 0 的数值', 'error')
    window.preferences.autoChangeTime = parseInt(result.value)
    toastMsg(`已启用，轮换间隔为 ${result.value} 分钟`)
  }
  pushData('WallPaperPreferences', window.preferences)
  addWallpaperTimer(window.preferences.autoChangeTime)
}

const showFavorites = () => {
  if (!window.preferences.favorites.length)
    return toastMsg('尚未收藏任何壁纸！', 'warning')
  var selector = document.querySelector('#fav')
  document
    .querySelectorAll('#footer img')
    .forEach(
      (x) => (x.style.display = x.style.display == 'none' ? 'block' : 'none'),
    )
  selector.style.zIndex = '1'
  selector.classList.remove('hide')
  selector.classList.add('show')
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

const updateFavorites = (selector, start, len) => {
  window.preferences.favorites
    .slice(start, start + len)
    .forEach((wallpaper) => {
      var img = new Image()
      img.src = wallpaper.thumbs.big
      img.onclick = function () {
        showOptions(wallpaper)
      }
      selector.appendChild(img)
    })
}

const closeFavorites = () => {
  var selector = document.querySelector('#fav')
  document
    .querySelectorAll('#footer img')
    .forEach(
      (x) => (x.style.display = x.style.display == 'none' ? 'block' : 'none'),
    )
  selector.classList.remove('show')
  selector.classList.add('hide')
  selector.innerHTML = ''
  selector.style.zIndex = '-1'
}

const givemeFour = async () => {
  if (window.WallPapers.length >= 8) {
    window.preferences.historyPapers = window.WallPapers.slice(0, 4)
    window.WallPapers = window.WallPapers.slice(4)
  } else {
    window.preferences.historyPapers = window.WallPapers.slice(
      window.WallPapers.length - 4,
    )
    window.preferences.page += 1
    await fetchWallpaper()
  }
  document.getElementById('givemefourback').style.display = 'block'
  updateImgs()
}

const givemeFourBack = async () => {
  if (window.preferences.historyPapers) {
    window.WallPapers = window.preferences.historyPapers.concat(
      window.WallPapers,
    )
    window.preferences.historyPapers = ''
    document.getElementById('givemefourback').style.display = 'none'
    updateImgs()
  }
}

document.querySelector('#automatic').onclick = async function () {
  if (window.preferences.favorites.length < 2)
    return toastMsg('收藏的图片少于2张，无法自动更换壁纸！', 'warning')
  autoChangeWallpaper()
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
  givemeFour()
}

document.querySelector('#givemefourback').onclick = async function () {
  givemeFourBack()
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

const wallhavenSayByeBye = async () => {
  let isSayByeByeToWallhaven = utools.db.get('isSayByeByeToWallhaven')?.data
  if (isSayByeByeToWallhaven) return
  await Swal.fire({
    title: '壁纸源变更',
    text:
      '由于原壁纸源WallHaven发布td壁纸，已被国家重拳出击，故将壁纸源由WallHeaven改为Alphacoders，由于该网站已不可访问，本插件将自动备份当前的用户数据到桌面/utoolsRandomWallpaperDataBackup.json文件中，然后清除插件内收藏的壁纸（自动下载到本地的壁纸不会删除）',
  })
  window.saveFile(
    window.joinpath(
      utools.getPath('desktop'),
      'utoolsRandomWallpaperDataBackup.json',
    ),
    JSON.stringify(window.preferences, null, 2),
  )
  window.preferences.favorites = []
  window.preferences.sorting = 'popular'
  window.preferences.categories = '1'
  window.pushData('WallPaperPreferences', window.preferences)
  window.pushData('isSayByeByeToWallhaven', true)
}

const init = () => {
  window.preferences = utools.db.get('WallPaperPreferences')?.data || {
    categories: '1',
    sorting: 'popular',
    // atleast: '2560x1440',
    page: 1,
  }
  if (!window.preferences.customScript) window.preferences.customScript = {}
  if (!window.preferences.favorites) window.preferences.favorites = []
  addWallpaperTimer(window.preferences.autoChangeTime)
}

init()
