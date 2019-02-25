class App {

    constructor(html, json) {

        let obj = this;
        this.components = {};
        this.media = [];
        this.currentlyPlaying = undefined;
        this.settings = JSON.parse(json);

        console.log(this.settings);

        /*
         *  INITIALIZE COMPONENTS
         */

        //Create container element
        let app = document.createElement("div");
        app.innerHTML = replaceLocalURLS(html);
        app.id = "sfc-app-container";
        document.body.appendChild(app);

        var objects = {};
        var errors = [];
        var temp = null;

        function find(elemID) {
            temp = document.getElementById(elemID);

            if (temp == null || temp == undefined)
                errors.push(" Could not find element '" + elemID + "'");

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
        for (let i in errors) {
            console.error(errors[i]);
            return;
        }

        //Set to objects var if no errors, otherwise set to {}
        this.components = errors.length == 0 ? objects : {};

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
        this.components.galleryTable.offset = 0; //used for scrolling gallery

        /*
         *  INITIALIZE EVENTS
         */

        this.components.galleryButton.onclick = this.toggleGallery.bind(this);

        this.components.stage.onclick = (e) => {
            if (e.target == this.components.stage)
                this.toggleApp();
        };

        this.components.left.onclick = (e) => {
            this.settings.ui.size += 5;
            this.applySettings();
            this.toggleGallery(this.components.gallery.style.height !== "0px");
        };

    }

    /*
     * fetchMedia runs the relevant getMedia function found under the
     * 'data collection' directory. It then creates all the media objects necessary
     */
    fetchMedia() {

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
            var temp = new Media(
                this,
                fetchedMedia[i].content,
                fetchedMedia[i].thumbnail
            );

            this.media.push(temp);
        }

        for (let i = 0; i < this.media.length; i++) {
            this.components.galleryTableRow.appendChild(this.media[i].thumbnail);
        }

        return true;
    }

    loadSettings(json) {

    }

    /*
     * applySettings gets various settings from this.settings and
     * applies them to the relevant items
     */
    applySettings(singleSettings) {

        //Switch used for onChange triggers in settings pane
        //to avoid re-applying unchanged settings
        // switch(singleSetting){}

        var ui = this.settings.ui;
        var base = ui.size;
        var components = this.components;

        //Calculate sizes based on settings
        var thumbnailHeight = base * ui.gallery.thumbnailHeight;
        var thumbnailSpacing = base * ui.gallery.thumbnailSpacing;
        var thumbnailBorder = base * ui.gallery.thumbnailBorder;
        var buttonSize = base * ui.buttons.height;
        var standardGap = base * ui.buttons.margin;

        //Gallery items
        // components.gallerySlider.style.paddingLeft = "160px";
        var halfGalleryHeight = (thumbnailHeight/2) + thumbnailBorder + thumbnailSpacing;
        components.galleryButton.style.bottom = halfGalleryHeight - (buttonSize/2)+ "px";

        //Thumbnails
        var elems = document.getElementsByClassName("sfc-thumbnail");
        for (let i = 0; i < elems.length; i++) {
            elems[i].style.height = thumbnailHeight + "px";
            elems[i].style.margin = thumbnailSpacing + "px";
            elems[i].style.borderSize = thumbnailBorder + "px";
            elems[i].style.opacity = ui.gallery.thumbnailOpacity;
        }

        //Change all buttons
        elems = document.getElementsByClassName("sfc-button");
        for (let i = 0; i < elems.length; i++) {
            console.log(elems[i]);
            elems[i].style.padding = buttonSize / 2 + "px";
            elems[i].style.margin = "auto " + standardGap + "px";
        }

        //counter
        components.counter.style.fontSize = ui.counter.fontSize + "px";
        components.counterTotal.style.fontSize = ui.counter.fontSize + "px";
        components.counterIndex.style.fontSize = ui.counter.fontSize + "px";

        this.alignGallery();
    }

    /*
     * toggleApp shows/hides the app
     */
    toggleApp(show) {

        let app = this.components.app;
        if (show === true) {
            app.style.display = "block";
            document.body.style.overflow = "hidden";
        } else if (show === false) {
            app.style.display = "none";
            document.body.style.overflow = "auto";
        } else {
            this.toggleApp(app.style.display !== "block");
        }

        this.alignGallery();
    }

    /*
     * toggleGallery shows/hides the gallery
     */
    toggleGallery(show) {
        let gallery = this.components.gallery;
        let settings = this.settings.ui.gallery;
        let base = this.settings.ui.size; //base ui size

        if (show === true) { //Show gallery

            let showingHeight = (base * settings.thumbnailHeight) +
                                (base * settings.thumbnailBorder*2) +
                                (base * settings.thumbnailSpacing*2);
            gallery.style.height = showingHeight + "px";

            gallery.onmousedown = () => {
                window.onmousemove = (e) => {
                    sfc.translateGallery(e.movementX);
                };
            };

            gallery.onmouseup = () => {
                window.onmousemove = () => {};
            };

        } else if (show === false) { //Hide gallery
            gallery.style.height = "0px";
            gallery.ondown = () => {};
        } else { //Hide if shown, show if hidden
            this.toggleGallery(gallery.style.height === "0px");
            return;
        }

        this.alignGallery();
    }

    alignGallery() {

        var alignTo;

        //Align to currentlyPlaying if currentlyPlaying is not undefined or hidden
        if (this.currentlyPlaying !== undefined && this.currentlyPlaying !== null) {
            //align to currently playing if not hidden
            alignTo = this.currentlyPlaying.thumbnail.hidden === false ?
                this.currentlyPlaying : undefined;
        }

        //set alignTo to first unhidden item if alignTo is still undefined
        if (alignTo === undefined) {
            //align to first media
            for (let i = 0; i < this.media.length; i++) {
                if (!this.media[i].thumbnail.hidden) {
                    alignTo = this.media[i];
                    break;
                }
            }
        }

        //If alignTo isn't found ignore alignment
        if (alignTo === undefined || alignTo === null)
            return;

        let windowCenter = window.innerWidth / 2;
        let offset = getPosition(alignTo.thumbnail).x;

        //move to middle of thumbnail if currently playing
        if (alignTo === this.currentlyPlaying) {
            offset += alignTo.thumbnail.clientWidth / 2;
        }

        offset = windowCenter - offset;
        this.components.galleryTable.offset = offset;
        this.components.galleryTable.style.transform = "translateX(" + offset + "px)";
    }

    /*
     *  Moves the galleryTable component left/right using style.translateX
     *  - translates by setting translateX = position + value
     */
    translateGallery(value) {
        let offset = this.components.galleryTable.offset + value;
        this.components.galleryTable.offset = offset;
        this.components.galleryTable.style.transform = "translateX(" + offset + "px)";
    }
    scrollGalleryLeft() {
        translateGallery(-1);
    }
    scrollGalleryRight() {
        translateGallery(1);
    }

    /*
     * play shows and plays the parsed media
     */
    play(media) {

        var stage = this.components.stage;

        if (this.currentlyPlaying) {
            this.currentlyPlaying.deselect();

            //Remove currently playing
            stage.removeChild(
                this.currentlyPlaying.content
            );

            this.currentlyPlaying = undefined;
        }

        //Play media if parsed
        if (media) {
            this.currentlyPlaying = media;
            this.currentlyPlaying.select();
            stage.appendChild(media.content);
        } else {
            console.log("Invalid media:");
            console.log(media);
            console.log("");
        }

        this.alignGallery();

    }

    /*
     * next deselects the current media and plays the
     * media next in line. 'next' being determined on
     * the state of the player. ie. if randomise is on,
     * next could be anything.
     */
    next() {

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

}

class Media {
    constructor(app, content, thumbnail) {

        this.playCount = 0;
        this.app = app;
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
        let element;

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
                // element.controls = false;
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
        };

        this.thumbnail = tableData;

    }

    select() {
        this.thumbnail.children[0].style.border = "2px solid white";
        this.thumbnail.children[0].style.opacity = "1";
    }

    deselect() {
        this.thumbnail.children[0].style.border = "2px solid transparent";
        this.thumbnail.children[0].style.opacity = this.app.settings.ui.gallery.thumbnailOpacity;
    }
}