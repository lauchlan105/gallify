(async function getExternalElements(){
    let html = await getFile("/interface.html");
    let json = await getFile("/settings.json");
    main(html, json);
}())

sfc = undefined;

/**
 * main runs all the necessary functions in
 * the necessary order.
 * 
 * @param {HTML} html
 * 
 */
function main(html, json) {
    sfc = new App(html, json);
    sfc.fetchMedia();
    sfc.applySettings();

    sfc.toggleApp(true);
    
    // window.onresize = temp;
    // temp();
}

function temp(){
    console.clear();
    console.log("Size" + ": " + sfc.settings.ui.size);
    console.log("");
    console.log("Gallery...");
    console.log("thumbnailHeight" + ": " + sfc.settings.ui.gallery.thumbnailHeight());
    console.log("thumbnailSpacing" + ": " + sfc.settings.ui.gallery.thumbnailSpacing());
    console.log("thumbnailBorder" + ": " + sfc.settings.ui.gallery.thumbnailBorder());
    console.log("thumbnailOpacity" + ": " + sfc.settings.ui.gallery.thumbnailOpacity());
    console.log("showingHeight" + ": " + sfc.settings.ui.gallery.showingHeight());
    console.log("hidingHeight" + ": " + sfc.settings.ui.gallery.hidingHeight());
    console.log("");
    console.log("buttons...");
    console.log("height" + ": " + sfc.settings.ui.buttons.height());
    console.log("margin" + ": " + sfc.settings.ui.buttons.margin());
    console.log("");
    console.log("counter...");
    console.log("fontSize" + ": " + sfc.settings.ui.counter.fontSize());
}

/**
 * getFile calls the 'getFile' function in the background.js
 * as a file request cannot be performed in this scope by the
 * nature of a chrome extension. Used primarily to fetch HTML code.
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
            (prefix) => {
                return prefix + baseURL;
            }
        );
    }

    return HTML;
}

// Helper function to get an element's exact position
// Code retreived from https://www.kirupa.com/html5/get_element_position_using_javascript.htm
function getPosition(el) {
    var xPos = 0;
    var yPos = 0;

    while (el) {
        if (el.tagName == "BODY") {
            // deal with browser quirks with body/window/document and page scroll
            var xScroll = el.scrollLeft || document.documentElement.scrollLeft;
            var yScroll = el.scrollTop || document.documentElement.scrollTop;

            xPos += (el.offsetLeft - xScroll + el.clientLeft);
            yPos += (el.offsetTop - yScroll + el.clientTop);
        } else {
            // for all other non-BODY elements
            xPos += (el.offsetLeft - el.scrollLeft + el.clientLeft);
            yPos += (el.offsetTop - el.scrollTop + el.clientTop);
        }

        el = el.offsetParent;
    }
    return {
        x: xPos,
        y: yPos
    };
}