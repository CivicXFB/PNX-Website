// noinspection JSUnresolvedFunction,JSUnresolvedVariable,DuplicatedCode,NonAsciiCharacters

let languageId = (window.language || navigator.language || navigator.browserLanguage).toLowerCase();
const $ = mdui.$;
const logoDesAmount = 9;

function switchTheme(noNotice) {
    const clazz = document.body.classList;
    if (clazz.contains("mdui-theme-layout-dark")) {
        clazz.remove("mdui-theme-layout-dark", "mdui-theme-primary-light-blue", "mdui-theme-accent-light-blue");
        clazz.add("mdui-theme-primary-indigo", "mdui-theme-accent-indigo");
        if (!noNotice) {
            mdui.snackbar(translate("more-menu.switch-to-day"), {
                buttonText: translate("more-menu.ok")
            });
        }
        window.localStorage.setItem("dark-theme", "false");
    } else {
        clazz.remove("mdui-theme-primary-indigo", "mdui-theme-accent-indigo");
        clazz.add("mdui-theme-layout-dark", "mdui-theme-primary-light-blue", "mdui-theme-accent-light-blue");
        if (!noNotice) {
            mdui.snackbar(translate("more-menu.switch-to-night"), {
                buttonText: translate("more-menu.ok")
            })
        }
        window.localStorage.setItem("dark-theme", "true");
    }
}

function defaultCheckTheme() {
    const flag = window.localStorage.getItem("dark-theme");
    if (flag && flag === "true") {
        switchTheme(true);
    }
}

defaultCheckTheme();
$('[translate=yes]').each((index, value) => {
    $(value).text(translate($(value).text()))
});

(function renderLogoDes() {
    const ele = document.getElementById('logo-dyn-description');

    function displayNextLogoDes(index, delay) {
        setTimeout(index => {
            const allDelay = retype(ele, translate("logo-des-" + index), 80);
            displayNextLogoDes(index + 1 > logoDesAmount ? 0 : index + 1, allDelay);
        }, delay + 2000, index);
    }

    displayNextLogoDes(0, 0);
})();


/**
 *
 * @param key {string}
 * @return {string}
 */
function translate(key) {
    key = key.trim();
    if (languageId === "zh-cn") {
        const tmp = chn[key];
        return tmp ? tmp : key;
    }
    const tmp = eng[key];
    return tmp ? tmp : key;
}

/**
 * 模拟打字效果
 * @param component {HTMLElement}
 * @param str {string}
 * @param delay {number} ms
 * @return {number} 消耗时间
 */
function retype(component, str, delay) {
    for (let i = 0, len = component.innerText.length; i <= len; i++) {
        setTimeout((len, str) => {
            component.innerText = str.substring(0, len);
        }, delay * i, len - i, component.innerText);
    }
    for (let i = 0, len = str.length; i <= len; i++) {
        setTimeout((len, str) => {
            component.innerText = str.substring(0, len);
        }, delay * (i + component.innerText.length + 1), i, str);
    }
    return (component.innerText.length + str.length + 1) * delay;
}

/**
 * 发送get请求
 * @param url {string}
 * @return {Promise<unknown>}
 */
function get(url) {
    return new Promise(function (resolve, reject) {
        const req = new XMLHttpRequest();
        req.open('GET', url);
        req.onload = function () {
            if (req.status === 200) {
                resolve(req.response);
            } else {
                reject(Error(req.statusText));
            }
        };
        req.onerror = function () {
            reject(Error("Network Error"));
        };
        req.send();
    });
}

async function refreshPNXServers(callback) {
    let response = await get("https://bstats.org/api/v1/plugins/10277/charts/nukkit_version/data");
    let data = JSON.parse(response);
    let count = 0;
    for (const each of data) {
        if (each.name.indexOf("PNX") !== -1) {
            count += each.y;
        }
    }
    response = await get("https://bstats.org/api/v1/plugins/16708/charts/servers/data");
    data = JSON.parse(response);
    count += data[data.length - 1][1];
    if (callback) {
        callback(count);
    }
}

async function refreshPNXPlayers(callback) {
    const response = await get("https://bstats.org/api/v1/plugins/16708/charts/players/data");
    const data = JSON.parse(response);
    const count = data[data.length - 1][1];
    if (callback) {
        callback(count);
    }
}


async function refreshAfdianSponsors() {
    const response = await get("https://api.powernukkitx.cn/v2/sponsor/afdian");
    const data = JSON.parse(response).sponsors;
    const bigTemplate = document.getElementById("sponsor-big-template").innerHTML;
    const smallTemplate = document.getElementById("sponsor-small-template").innerHTML;
    let bigHTML = "";
    let smallHTML = "";
    for (const each of data.sort((a, b) => b.last_pay_time - a.last_pay_time)) {
        if (each.current_plan && each.current_plan.name && each.current_plan.name !== "") {
            bigHTML += bigTemplate.replace("dynamic.user-icon-src", each.user.avatar)
                .replace("dynamic.user-name", each.user.name)
                .replace("dynamic.user-donation", translate("text.thanks") + translate(each.current_plan.name));
        } else {
            smallHTML += smallTemplate.replace("dynamic.user-icon-src", each.user.avatar)
                .replace("dynamic.user-name", each.user.name);
        }
    }
    document.getElementById("donating-sponsor-box").innerHTML = bigHTML;
    document.getElementById("all-sponsor-box").innerHTML = smallHTML;
}

let awesomeListIndex = 0;

async function refreshAwesomeList() {
    const moreObj = document.getElementById("awesome-list-more");
    const response = await get("/data/awesome-list.json");
    const data = JSON.parse(response);
    const template = document.getElementById("awesome-list-item-template").innerHTML;

    for (let i = 0; i < 5; i++) {
        const each = data[awesomeListIndex];
        let iconID = "format_list_bulleted";
        switch (each.type) {
            case "news":
                iconID = "fiber_new";
                break;
            case "tips":
                iconID = "live_help";
                break;
        }
        let html = template.replace("dynamic.title", each.title[languageId] ?? each.title["en-us"])
            .replace("dynamic.content", each.content[languageId] ?? each.content["en-us"])
            .replace("dynamic.link", each.link ?? "#")
            .replace("dynamic.icon", each.imgUrl ? `<div class="mdui-list-item-avatar"><img src="${each.imgUrl}" alt="${each.title}"/></div>` : `<i class="mdui-list-item-avatar mdui-icon material-icons">${iconID}</i>`);
        const liObj = document.createRange().createContextualFragment(html);
        awesomeListIndex++;
        moreObj.parentNode.insertBefore(liObj, moreObj);
        const lineObj = document.createElement("LI");
        lineObj.classList.add("mdui-divider-inset");
        moreObj.parentNode.insertBefore(lineObj, moreObj);
        if (awesomeListIndex >= data.length) {
            moreObj.remove();
            break;
        }
    }
}

get("https://api.powernukkitx.cn/v2/git/star").then(response => document.getElementById("pnx-star-count").innerText = JSON.parse(response).star);
refreshAfdianSponsors().then(() => {
});
refreshPNXServers(count => document.getElementById("pnx-server-count").innerText = count).then(() => {
});
refreshPNXPlayers(count => document.getElementById("pnx-player-count").innerText = count).then(() => {
});
refreshAwesomeList().then(() => {
});

/**
 * Hey, don't look, this is really not an egg :P
 */
const egg_title1 = "🌌 PowerNukkitX"
const egg_title2 = "Just an egg :D"
const egg_content = `
🏡 WebSite: https://www.powernukkitx.cn
📌 GitHub:  https://github.com/powernukkitx
📖 Document: https://doc.powernukkitx.cn
----------------------------------------
🎉 Congratulations on finding this egg!
🔧 Web Version: 1.0
`
const egg_style_title1 = `
font-size: 20px;
font-weight: 600;
color: #CCCCCC;
`
const egg_style_title2 = `
font-style: oblique;
font-size:14px;
color: #3f51b5;
font-weight: 400;
`
const egg_style_content = `
color: rgb(30,152,255);
`
console.log(`%c${egg_title1} %c${egg_title2}
%c${egg_content}`, egg_style_title1, egg_style_title2, egg_style_content)