function App() {

    let obj = this;

    this.components;
    this.media = [];
    this.currentlyPlaying;
    this.settings = {
        ui: {
            size: 100,

            gallery: {
                thumbnailHeight: function () { return obj.settings.ui.size; },
                thumbnailBorder: function () { return obj.settings.ui.size * 0.02; }, //10%
                thumbnailOpacity: function () { return 0.3 },
                showingHeight: function () {
                    return obj.settings.ui.gallery.thumbnailHeight() + (obj.settings.ui.gallery.thumbnailBorder() * 2);
                },
                hidingHeight: function () { return 0; }
            },

            buttons: {
                height: function () { return obj.settings.ui.size * 0.6; }, //70%
                margin: function () {
                    return (obj.settings.ui.gallery.showingHeight() - obj.settings.ui.buttons.height()) / 2;
                }
            },

            counter: {
                fontSize: function () { return obj.settings.ui.size * 0.25; } //25%
            }
        },
        app: {
            loopAtEnd: true
        },
        webm: {
            controls: true
        },
        picture: {

        },
    };

    this.initialize = function (html) {

        /*
         *  INITIALIZE COMPONENTS
         */

        //Create container element
        let app = document.createElement("div");
        app.innerHTML = replaceLocalURLS(html);;
        app.id = "sfc-app-container";
        document.body.appendChild(app);

        //Save all found elements to components attribute
        this.components = initElements();

        if (!this.components) {
            console.error("Components failed to intialize");
            return false;
        }

        /*
        *  INITIALIZE STYLES
        *  This involves settings styles using javascript
        *  While the styles themselves may not change,
        *  the javascript value will no longer be undefined,
        *  thus useful for logical operations
        */

        this.components.app.style.display = "block";
        this.components.app.style.opacity = "1";
        this.components.gallery.style.height = "0px";

        /*
        *  INITIALIZE EVENTS
        */

        this.components.galleryButton.onclick = this.toggleGallery;
        this.components.stage.onclick = function (event) {
            if (event.target == obj.components.stage)
                obj.toggleApp();
        };

        this.components.left.onclick = function () {
            obj.settings.ui.size += 5;
            obj.applySettings();
            obj.toggleGallery(obj.components.gallery.style.height !== "0px");
        }

        /*
        * APPLY SETTINGS
        * to refit UI scale
        */

        this.applySettings();
    };

    this.fetchMedia = function () {

        let fetchedMedia = getMedia();

        if (!fetchedMedia) {
            console.error("Media retrieval was unsuccessful");
            return false;
        }

        if (fetchedMedia.constructor !== Array) {
            console.error("Media retrieval was unsuccessful: media was of" +
                " type " + fetchedMedia.constructor + ". Array expected");
            return false;
        }

        if (fetchedMedia.length < 1) {
            console.error("Media retrieval was unsuccessful: " +
                "No media was found");
            return false;
        }

        for (var i = 0; i < fetchedMedia.length; i++) {
            var temp = new media(
                this,
                fetchedMedia[i].content,
                fetchedMedia[i].thumbnail
            );

            this.media.push(temp);
        }

        for (var i = 0; i < this.media.length; i++) {
            this.components.galleryTableRow.appendChild(this.media[i].thumbnail);
        }

        return true;
    };

    this.applySettings = function (singleSettings) {

        //Switch used for onChange triggers in settings pane
        //to avoid re-applying unchanged settings
        // switch(singleSetting){}

        var settings = this.settings;
        var components = this.components;

        //Calculate sizes based on settings
        var thumbnailHeight = settings.ui.gallery.thumbnailHeight();
        var thumbnailBorder = settings.ui.gallery.thumbnailBorder();
        var buttonSize = settings.ui.buttons.height();
        var standardGap = settings.ui.buttons.margin();

        //Change all thumbnails
        var elems = document.getElementsByClassName("sfc-thumbnail");
        for (var i = 0; i < elems.length; i++) {
            elems[i].style.height = thumbnailHeight + "px";
            elems[i].style.margin = thumbnailBorder + "px auto";
            elems[i].style.paddingWidth = thumbnailBorder + "px " + (thumbnailBorder * 2) + "px";
            elems[i].style.opacity = settings.ui.gallery.thumbnailOpacity();
        }

        //Change all buttons
        elems = document.getElementsByClassName("sfc-button");
        for (var i = 0; i < elems.length; i++) {
            elems[i].style.padding = buttonSize / 2 + "px";
            elems[i].style.margin = "auto " + (standardGap) + "px";
        }

        //Gallery related items
        // components.galleryTable.style.borderSpacing = thumbnailBorder + "px";
        components.gallerySlider.style.paddingLeft = ((standardGap * 2) + buttonSize - thumbnailBorder) + "px";
        components.galleryButton.style.bottom = standardGap + "px";

        components.counter.style.fontSize = settings.ui.counter.fontSize() + "px";
        components.counterTotal.style.fontSize = settings.ui.counter.fontSize() + "px";
        components.counterIndex.style.fontSize = settings.ui.counter.fontSize() + "px";
    };

    this.toggleApp = function (show) {
        let app = obj.components.app;
        if (show === true) {
            app.style.display = "block";
        } else if (show === false) {
            app.style.display = "none";
        } else {
            obj.toggleApp(app.style.display !== "block");
        }
    }

    this.toggleGallery = function (show) {
        let gallery = obj.components.gallery;
        if (show === true) { //Show gallery
            gallery.style.height = obj.settings.ui.gallery.showingHeight() + "px";
        } else if (show === false) { //Hide gallery
            gallery.style.height = obj.settings.ui.gallery.hidingHeight() + "px";
        } else { //Hide if shown, show if hidden
            obj.toggleGallery(gallery.style.height === "0px");
        }
    }

    this.play = function (media) {

        var stage = this.components.stage;

        if (this.currentlyPlaying) {
            this.currentlyPlaying.deselect();

            //Remove currently playing
            stage.removeChild(
                this.currentlyPlaying.content
            );
        }

        //Play media if parsed
        if (media) {
            this.currentlyPlaying = media;
            this.currentlyPlaying.select();
            stage.appendChild(media.content);
        }else{
            console.log("wasn't media");
        }
    }

    this.next = function () {

        //Base next() on whether media is currently playing
        if (this.currentlyPlaying) {

            //if the user would like to go back to the start of
            //the media when they reach the end
            if (this.settings.app.loopAtEnd) {
                var nextMedia = this.currentlyPlaying.index % this.media.length;
                nextMedia = this.media[nextMedia];
                this.play(nextMedia);
            }

        } else {
            this.play(this.media[0]);
        }
    }

    return this;
}

function media(app, content, thumbnail) {

    this.playCount = 0;
    this.index = app.media.length;

    /*
     * Get and assign type. Assign "" if invalid
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


getFile("/interface/interface.html").then(function (response) {
    main(response);
});
sfc = undefined;
function main(html) {
    sfc = new App();
    sfc.initialize(html);
    sfc.fetchMedia();
    sfc.applySettings();
}

function initElements() {

    var objects = {};
    var errors = [];
    var temp = null;

    function find(elemID) {
        temp = document.getElementById(elemID);
        if (temp == null || temp == undefined) {
            errors.push(" Could not find element '" + elemID + "'");
        }

        return temp;
    }

    //Main
    objects.app = find("sfc-app-container");
    objects.stage = find("sfc-stage");

    //Stage
    objects.left = find("sfc-button-left");
    objects.right = find("sfc-button-right");

    //Gallery
    objects.gallery = find("sfc-gallery");
    objects.gallerySlider = find("sfc-gallery-slider");
    objects.galleryTable = find("sfc-gallery-table");
    objects.galleryTableRow = find("sfc-gallery-tr");
    objects.galleryButton = find("sfc-button-gallery");

    //Counter
    objects.counter = find("sfc-counter");
    objects.counterIndex = find("sfc-counter-index");
    objects.counterTotal = find("sfc-counter-total");

    //Print all errors
    for (let i in errors) { console.error(errors[i]); }

    //Return false if errors
    return errors.length == 0 ? objects : false;

}

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

function replaceLocalURLS(HTML) {

    let baseURL = chrome.extension.getURL("/interface/");
    let regX = /((href)|(src))="(?!(http|chrome))/;

    while (HTML.match(regX)) {
        HTML = HTML.replace(
            regX,
            function (x) {
                return x + baseURL;
            }
        );
    }

    return HTML;
}