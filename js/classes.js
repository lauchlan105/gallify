class App {

    constructor(html) {

        let obj = this;
        this.components = {};
        this.media = [];
        this.currentlyPlaying = undefined;
        this.settings = {
            ui: {
                size: 100,

                gallery: {
                    thumbnailHeight: function () {
                        return obj.settings.ui.size;
                    },
                    thumbnailSpacing: function () {
                        return obj.settings.ui.size * 0.02;
                    }, //2%
                    thumbnailBorder : function () {
                        return obj.settings.ui.size * 0.02;
                    }, //2%
                    thumbnailOpacity: function () {
                        return 0.3
                    },
                    showingHeight: function () {
                        return obj.settings.ui.gallery.thumbnailHeight() +
                            (obj.settings.ui.gallery.thumbnailSpacing() * 2) +
                            (obj.settings.ui.gallery.thumbnailBorder() * 2);
                    },
                    hidingHeight: function () {
                        return 0;
                    }
                },

                buttons: {
                    height: function () {
                        return obj.settings.ui.size * 0.6;
                    }, //70%
                    margin: function () {
                        return (obj.settings.ui.gallery.showingHeight() - obj.settings.ui.buttons.height()) / 2;
                    }
                },

                counter: {
                    fontSize: function () {
                        return obj.settings.ui.size * 0.25;
                    } //25%
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
     * fetchMedia runs the getMedia function that
     * is found in the relevant js file under the
     * 'data collection' directory.
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

        for (var i = 0; i < this.media.length; i++) {
            this.components.galleryTableRow.appendChild(this.media[i].thumbnail);
        }

        return true;
    };

    /*
     * applySettings gets various settings from this.settings and
     * applies them to the relevant items
     */
    applySettings(singleSettings) {

        //Switch used for onChange triggers in settings pane
        //to avoid re-applying unchanged settings
        // switch(singleSetting){}

        var settings = this.settings;
        var components = this.components;

        //Calculate sizes based on settings
        var thumbnailHeight = settings.ui.gallery.thumbnailHeight();
        var thumbnailSpacing = settings.ui.gallery.thumbnailSpacing();
        var thumbnailBorder = settings.ui.gallery.thumbnailBorder();
        var buttonSize = settings.ui.buttons.height();
        var standardGap = settings.ui.buttons.margin();

        //Gallery items
        // components.gallerySlider.style.paddingLeft = "0px";
        components.galleryButton.style.bottom = (thumbnailHeight - buttonSize)/2 + "px";

        //Thumbnails
        var elems = document.getElementsByClassName("sfc-thumbnail");
        for (let i = 0; i < elems.length; i++) {
            elems[i].style.height = thumbnailHeight + "px";
            elems[i].style.margin = thumbnailSpacing + "px";
            elems[i].style.border = thumbnailBorder + "px solid transparent";
            elems[i].style.opacity = settings.ui.gallery.thumbnailOpacity();
        }

        //Change all buttons
        elems = document.getElementsByClassName("sfc-button");
        for (let i = 0; i < elems.length; i++) {
            elems[i].style.padding = buttonSize / 2 + "px";
            elems[i].style.margin = "auto " + standardGap + "px";
        }

        //counter
        components.counter.style.fontSize = settings.ui.counter.fontSize() + "px";
        components.counterTotal.style.fontSize = settings.ui.counter.fontSize() + "px";
        components.counterIndex.style.fontSize = settings.ui.counter.fontSize() + "px";

        this.alignGallery();
    };

    /*
     * toggleApp shows/hides the app
     */
    toggleApp(show) {
        let app = this.components.app;
        if (show === true) {
            app.style.display = "block";
        } else if (show === false) {
            app.style.display = "none";
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
        if (show === true) { //Show gallery
            gallery.style.height = this.settings.ui.gallery.showingHeight() + "px";
        } else if (show === false) { //Hide gallery
            gallery.style.height = this.settings.ui.gallery.hidingHeight() + "px";
        } else { //Hide if shown, show if hidden
            this.toggleGallery(gallery.style.height === "0px");
            return;
        }

        this.alignGallery();
    }

    alignGallery() {

        var alignTo;

        //Align to currentlyPlaying if currentlyPlaying is !undefined || hidden
        if (this.currentlyPlaying !== undefined && this.currentlyPlaying !== null) {
            //align to currently playing if not hidden
            alignTo = this.currentlyPlaying.hidden === false ?
                this.currentlyPlaying : undefined;
        }

        //set alignTo to first !hidden item if alignTo is still undefined
        if (alignTo === undefined) {
            //align to first media
            for(let i = 0; i < this.media.length; i++){
                if(!this.media[i].thumbnail.hidden){
                    alignTo = this.media[i].thumbnail;
                    break;
                }
            }
        }

        //If alignTo isn't found ignore alignment
        if(alignTo === undefined || alignTo === null)
            return;

        let windowCenter = window.innerWidth / 2;
        let offset = getPosition(alignTo).x;
        console.log(this.settings.ui);
        offset = windowCenter - offset;
        
        // this.components.galleryTableRow.style.transform = "translateX(" + offset + "px)";
    }

    scrollGalleryLeft() {
        let offset = getPosition(this.components.galleryTableRow) + 1;
        this.components.galleryTableRow.style.transform = "translateX(" + offset + "px)";
    }

    scrollGalleryRight() {
        let offset = getPosition(this.components.galleryTableRow) - 1;
        this.components.galleryTableRow.style.transform = "translateX(" + offset + "px)";
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
        };

        this.thumbnail = tableData;

    }

    select() {
        this.thumbnail.children[0].style.border = "2px solid white";
        this.thumbnail.children[0].style.opacity = "1";
    }

    deselect() {
        this.thumbnail.children[0].style.border = "2px solid transparent";
        this.thumbnail.children[0].style.opacity = app.settings.ui.gallery.thumbnailOpacity();
    }
}