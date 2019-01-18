getFile("/interface.html").then(function (response) {
    main(response);
});

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
    sfc.fetchMedia();
    sfc.applySettings();
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
            function (prefix) {
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