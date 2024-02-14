var bbMemo = {
  memos: 'https://memos.bestrui.top/',
  limit: '15',
  creatorId: '101',
  domId: '#bber',
};
if (typeof (bbMemos) !== "undefined") {
  for (var key in bbMemos) {
    if (bbMemos[key]) {
      bbMemo[key] = bbMemos[key];
    }
  }
}
function loadCssCode(code) {
  var style = document.createElement('style');
  style.type = 'text/css';
  style.rel = 'stylesheet';
  style.appendChild(document.createTextNode(code));
  var head = document.getElementsByTagName('head')[0];
  head.appendChild(style);
}

var limit = bbMemo.limit
var memos = bbMemo.memos
var mePage = 1, offset = 0, nextLength = 0, nextDom = '';
var bbDom = document.querySelector(bbMemo.domId);
var load = '<div class="bb-load"><button class="load-btn button-load">加载中……</button></div>'

if (bbDom) {
  getFirstList() //首次加载数据

  var btn = document.querySelector("button.button-load");
  btn.addEventListener("click", function () {
    btn.textContent = '加载中……';
    updateHTMl(nextDom)
    if (nextLength < limit) { //返回数据条数小于限制条数，隐藏
      document.querySelector("button.button-load").remove()
      return
    }

    getNextList()
  });
}
function getFirstList() {
  bbDom.insertAdjacentHTML('afterend', load);
  let tagHtml = `<div class="memos-search-all img-hide">
<div class="memos-search">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-auto opacity-30 dark:text-gray-200"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
<input type="text" id="memos-search-input" placeholder="输入关键词，搜索我的日常" onkeydown="searchMemoevent(event)">
</div>
<div id="tag-list-all"></div>
</div>
<div id="tag-list"></div>` // TAG筛选 memos搜索
  bbDom.insertAdjacentHTML('beforebegin', tagHtml); // TAG筛选

  var bbUrl = memos + "api/v1/memo?creatorId=" + bbMemo.creatorId + "&rowStatus=NORMAL&limit=" + limit;
  fetch(bbUrl).then(res => res.json()).then(resdata => {
    updateHTMl(resdata);
    var nowLength = resdata.length;
    if (nowLength < limit) { //返回数据条数小于 limit 则直接移除“加载更多”按钮，中断预加载
      document.querySelector("button.button-load").remove()
      return
    }
    mePage++
    offset = limit * (mePage - 1)
    getNextList()
  });

}
//预加载下一页数据
function getNextList() {
  var bbUrl = memos + "api/v1/memo?creatorId=" + bbMemo.creatorId + "&rowStatus=NORMAL&limit=" + limit + "&offset=" + offset;
  fetch(bbUrl).then(res => res.json()).then(resdata => {
    nextDom = resdata;
    nextLength = nextDom.length
    mePage++
    offset = limit * (mePage - 1)
    if (nextLength < 1) { //返回数据条数为 0 ，隐藏
      document.querySelector("button.button-load").remove()
      return
    }
  })
}


// 插入 html 
function updateHTMl(data) {
  var result = "", resultAll = "";
  const TAG_REG = /#([^#\s!.,;:?"'()]+)(?= )/g
    , IMG_REG = /\!\[(.*?)\]\((.*?)\)/g //content 内 md 格式图片
    , LINK_REG = /\[(.*?)\]\((.*?)\)/g //链接新窗口打开
  marked.setOptions({
    breaks: false,
    smartypants: false,
    langPrefix: 'language-',
    headerIds: false,
    mangle: false
  });
  for (var i = 0; i < data.length; i++) {
    var memo_id = data[i].id; //评论调用
    var bbContREG = data[i].content
      .replace(TAG_REG, "")
      .replace(IMG_REG, '')
      .replace(LINK_REG, '<a href="$2" target="_blank">$1</a>')
    bbContREG = marked.parse(bbContREG)

    //解析 content 内 md 格式图片
    var IMG_ARR = data[i].content.match(IMG_REG) || '', IMG_ARR_Grid = '';
    if (IMG_ARR) {
      var IMG_ARR_Length = IMG_ARR.length, IMG_ARR_Url = '';
      if (IMG_ARR_Length !== 1) { var IMG_ARR_Grid = " grid grid-" + IMG_ARR_Length }
      IMG_ARR.forEach(item => {
        let imgSrc = item.replace(/!\[.*?\]\((.*?)\)/g, '$1')
        IMG_ARR_Url += '<figure class="gallery-thumbnail"><img loading="lazy" decoding="async" class="img thumbnail-image" loading="lazy" decoding="async" src="' + imgSrc + '"/></figure>'
      });
      bbContREG += '<div class="resimg' + IMG_ARR_Grid + '">' + IMG_ARR_Url + '</div>';
    }


    //解析内置资源文件
    if (data[i].resourceList && data[i].resourceList.length > 0) {
      var resourceList = data[i].resourceList;
      var imgUrl = '', resUrl = '', resImgLength = 0;
      for (var j = 0; j < resourceList.length; j++) {
        var restype = resourceList[j].type.slice(0, 5)
        var resexlink = resourceList[j].externalLink
        var resLink = '', fileId = ''
        if (resexlink) {
          resLink = resexlink
        } else {
          fileId = resourceList[j].publicId || resourceList[j].name
          resLink = memos + 'o/r/' + fileId
        }
        if (restype == 'image') {
          imgUrl += '<figure class="gallery-thumbnail"><img loading="lazy" decoding="async" class="img thumbnail-image" src="' + resLink + '"/></figure>'
          resImgLength = resImgLength + 1
        }
        if (restype !== 'image') {
          resUrl += '<a target="_blank" rel="noreferrer" href="' + resLink + '">' + resourceList[j].filename + '</a>'
        }
      }
      if (imgUrl) {
        var resImgGrid = ""
        if (resImgLength !== 1) { var resImgGrid = "grid grid-" + resImgLength }
        bbContREG += '<div class="resimg ' + resImgGrid + '">' + imgUrl + '</div></div>'
      }
      if (resUrl) {
        bbContREG += '<p class="datasource">' + resUrl + '</p>'
      }
    }
    result += `
      <li class="bb-list-li img-hide" id="${memo_id}">
        <div class="memos-pl">
        <div class="memos_diaoyong_time">${moment(data[i].createdTs * 1000).twitterLong()}</div>
        </div>
        <div class="datacont" view-image>${bbContREG}</div>
        <div class="memos_diaoyong_top">
        <div class="memos-zan"><emoji-reaction class="reactions" reactTargetId="/m/${memo_id}" theme="system" endpoint="https://emaction.bestrui.top" availableArrayString="👍,thumbs-up;😄,smile-face;😎,cool;😍,se-face;😅,han-face;😋,xiang-face;😭,ku-face;😕,confused-face;🌈,caihong;❤️,red-heart;🎉,party-popper;"></emoji-reaction></div>
        
        <div id="memo_${memo_id}" class="artalk hidden"></div>
      </li>`;
  } // end for

  var bbBefore = "<section class='bb-timeline'><ul class='bb-list-ul'>";
  var bbAfter = "</ul></section>";
  resultAll = bbBefore + result + bbAfter;
  bbDom.insertAdjacentHTML('beforeend', resultAll);

  if (document.querySelector('button.button-load')) document.querySelector('button.button-load').textContent = '加载更多 ...';
}





// 搜索 Memos
function searchMemoevent(event) {
  if (event.key === "Enter") {
    searchMemo();
  }
}

function searchMemo() {
  let searchText = document.querySelector('#memos-search-input').value;
  let tagHtmlNow = `<div class='memos-tag-sc-2' onclick='javascript:location.reload();'><div class='memos-tag-sc-1' >关键词搜索:</div><div class='memos-tag-sc' >${searchText}<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-auto ml-1 opacity-40"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg></div></div>`
  document.querySelector('#tag-list').innerHTML = tagHtmlNow;
  let bbUrl = memos + "api/v1/memo?creatorId=" + bbMemo.creatorId + "&content=" + searchText + "&limit=20";
  fetchMemoDOM(bbUrl);
}

function fetchMemoDOM(bbUrl) {
  fetch(bbUrl)
    .then(res => res.json())
    .then(resdata => {
      let arrData = resdata || '';
      if (resdata.data) {
        arrData = resdata.data;
      }
      if (arrData.length > 0) {
        // 清空旧的搜索结果和加载按钮
        document.querySelector(bbMemo.domId).innerHTML = "";
        if (document.querySelector("button.button-load")) {
          document.querySelector("button.button-load").remove();
        }
        updateHTMl(resdata);
      } else {
        alert("搜不到，尝试换一个关键词");
        setTimeout(() => location.reload(), 1000);
      }
    });
}