getFile("/interface.html").then(function (response) {
    main(response);
});

/**
 */
function media(app, content, thumbnail) {

    this.playCount = 0;
    this.index = app.media.length;

    /*
     * Get and assign type (ie. gif, webm, mp4, etc.). 
     * Assign "" if invalid
     */
    var regX = /\.{1}(jpg|png|webm|gif|gifv|mp4)/gi;
    var matches = content.match(regX);

    if (matches.length !== 1) {
        console.error("Invalid media type: " + content);
        console.error(matches);
        this.type = "";
    } else {
        this.type = matches[0];
    }

    /*
     * Create and assign content
     */
    var element = undefined;

    //Create content's DOM element
    switch (this.type) {
        case ".jpg":
        case ".png":
        case ".gif":
            element = document.createElement("img");
            break;

        case ".webm":
        case ".mp4":
        case ".gifv":
            element = document.createElement("video");
            element.style.height = "inherit";
            element.preload = "auto";
            element.controls = app.settings.webm.controls;
            break;

        default:
            console.log("Content type was not caught");
            console.log(" when creating the element");
            console.log(type);
            break;
    }

    element.id = "sfc-now-playing";
    element.src = content;

    this.content = element;

    /*
     * Create thumbnail element and assign onclick
     */

    //Create thumbnail
    let image = document.createElement("img");
    image.src = thumbnail;
    image.className = "sfc-thumbnail";

    //Create surrounding table cell
    var tableData = document.createElement("td");
    tableData.appendChild(image);

    var obj = this;

    tableData.onclick = function (event) {
        app.play(obj);
    }

    this.thumbnail = tableData;

    this.select = function () {
        this.thumbnail.children[0].style.border = "2px solid white";
        this.thumbnail.children[0].style.opacity = "1";
    };

    this.deselect = function () {
        this.thumbnail.children[0].style.border = "2px solid transparent";
        this.thumbnail.children[0].style.opacity = app.settings.ui.gallery.thumbnailOpacity();
    };

    return this;
}

sfc = undefined;

/**
 * main runs all the necessary functions in
 * the necessary order.
 * 
 * @param {HTML} html
 * 
 */
function main(html) {
    sfc = new App(html);
    sfc.applySettings();
}

/**
 * getFile calls the 'getFile' function in the background.js
 * as a file request cannot be performed in this scope by the
 * nature of a chrome extension
 */
function getFile(relativePath) {
    return new Promise((resolve, reject) => {
        //Params are message, sender, callback
        chrome.runtime.sendMessage({
            "function": "getFile",
            "args": [chrome.extension.getURL(relativePath)]
        },
            null,
            function (response) {
                resolve(response.message);
            }
        );
    });
}

/**
 * replaceLocalURLS gets relative resources paths
 * and prepends the chrome extension path to any resource
 */
function replaceLocalURLS(HTML) {

    let baseURL = chrome.extension.getURL("/");
    let regX = /((href)|(src))="(?!(http|chrome))/;
    
    while (HTML.match(regX)) {
        HTML = HTML.replace(
            regX,
            function (prefix) {
                return prefix + baseURL;
            }
        );
    }

    return HTML;
}