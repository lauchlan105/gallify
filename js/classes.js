class App {

    constructor(html, json) {

        window.app = this;

        this.components = {};
        this.media = [];
        this.currentlyPlaying = undefined;
        this.settings = JSON.parse(json);

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
        objects.main = find("sfc-main");
        objects.stageParent = find("sfc-stage-parent");
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
        objects.galleryCurtain = {};
        objects.galleryCurtain.left = find("sfc-left-curtain");
        objects.galleryCurtain.right = find("sfc-right-curtain");

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

        /*
         * This event waits for the gallery transition to end.
         * Gallery transition ending halts events that need to loop
         * while the gallery is moving (see toggleGallery)
         */
        this.components.gallery.addEventListener(whichTransitionEvent(), function(){
            window.app.components.gallery.transitioning = false;
        });

        //Buttons
        this.components.galleryButton.onclick = this.toggleGallery.bind(this);
        this.components.left.addEventListener('click', function(e){
            window.app.playPrevious();
        });
        this.components.right.addEventListener('click', function(e){
            window.app.playNext();
        });

        //Events to close app by clicking background
        this.components.stage.addEventListener('click', function(e){
            if(e.target === window.app.components.stage)
                window.app.toggleApp(false);
        });
        this.components.stageParent.addEventListener('click', function(e){
            if(e.target === window.app.components.stageParent)
                window.app.toggleApp(false);
        });
        this.components.gallerySlider.addEventListener('click', function(e){
            if(e.target === window.app.components.gallerySlider)
                window.app.toggleApp(false);
        });

        window.onclick = function(e){
            // console.log(e.target);
        }

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

    /*
     * applySettings gets various settings from this.settings and
     * applies them to the relevant items
     */
    applySettings(singleSettings) {

        /* 
         * ####
         * TODO
         * #### 
         */
        //Switch used for onChange triggers in settings pane
        //to avoid re-applying unchanged settings
        // switch(singleSetting){}

        var ui = this.settings.ui;
        var base = ui.size;
        var components = this.components;

        /*
         * Calculate sizes based on settings
         */
        var thumbnailHeight = base * ui.gallery.thumbnailHeight;
        var thumbnailSpacing = base * ui.gallery.thumbnailSpacing;
        var thumbnailBorder = base * ui.gallery.thumbnailBorder;
        var buttonSize = base * ui.buttons.height;
        var standardGap = base * ui.buttons.margin;

        /*
         * Stage
         */ 
        var r = ui.stage.color.r;
        var g = ui.stage.color.g;
        var b = ui.stage.color.b;
        var a = ui.stage.color.a;
        var color = "rgba(" + r + ", " + g + ", " + b + ", " + a + ")";

        components.main.style.background = color;
        components.main.style["-webkit-box-shadow"] = "inset 0px 0px 89px 16px " + color;
        components.main.style["-moz-box-shadow"] = "inset 0px 0px 89px 16px " + color;
        components.main.style["box-shadow"] = "inset 0px 0px 89px 16px " + color;

        /* 
         * Gallery
         */
        var halfGalleryHeight = (thumbnailHeight/2) + thumbnailBorder + thumbnailSpacing;
        components.galleryButton.style.bottom = halfGalleryHeight - (buttonSize/2)+ "px";

        /*
         * Gallery thumbnails
          */
        var elems = document.getElementsByClassName("sfc-thumbnail");
        for (let i = 0; i < elems.length; i++) {
            elems[i].style.height = thumbnailHeight + "px";
            elems[i].style.margin = thumbnailSpacing + "px";
            elems[i].style.borderSize = thumbnailBorder + "px";
            elems[i].style.opacity = ui.gallery.thumbnailOpacity;
        }

        /*
         * Gallery curtains
         */
        components.galleryCurtain.left.style.background  = color;
        components.galleryCurtain.left.style.background  = "-webkit-linear-gradient(to right, " + color + " -20%, transparent)";
        components.galleryCurtain.left.style.background  = "linear-gradient(to right, " + color + " -20%, transparent)";
        components.galleryCurtain.right.style.background = color;
        components.galleryCurtain.right.style.background = "-webkit-linear-gradient(to right, " + color + " -20%, transparent)";
        components.galleryCurtain.right.style.background = "linear-gradient(to right, " + color + " -20%, transparent)";

        //Change all buttons
        elems = document.getElementsByClassName("sfc-button");
        for (let i = 0; i < elems.length; i++) {
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

        //Uses runUntil util function
        //to run callback() until condition is false.
        //gallery.trainsitioning is set by transitionend event
        function refresh(){
            
            var callback = function(){
                console.log("refreshing");
                if(window.app.currentlyPlaying !== undefined)
                    window.app.currentlyPlaying.refreshSize();
            };

            var condition = function(){
                return window.app.components.gallery.transitioning;
            };

            runUntil(callback, condition, 50);
        }

        if (show === true) { //Show gallery

            let showingHeight = (base * settings.thumbnailHeight) +
                                (base * settings.thumbnailBorder*2) +
                                (base * settings.thumbnailSpacing*2);
            gallery.style.height = showingHeight + "px";
            
            gallery.transitioning = true;
            refresh();

        } else if (show === false) { //Hide gallery
            gallery.style.height = "0px";
            gallery.transitioning = true;
            refresh();
        } else { //Hide if shown, show if hidden
            this.toggleGallery(gallery.style.height === "0px");
            return;
        }

        this.alignGallery();

    }

    /*
     * alignGallery translates the galleryTable so that the
     * currently playing media is in the center of the window
     */
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
        } else if (media !== undefined){
            console.log("Invalid media:");
            console.log(media);
            console.log("");
        }

        this.alignGallery();

    }

    /*
     * previous returns the previous valid media object
     * based on user settings
     */
    previous() {

        var index = 0;
        var distance = 0;
        if (this.currentlyPlaying)
            index = this.currentlyPlaying.index;

        index--; //start at the next media straight away
        for(var i = index; i < this.media.length; i--){

            //This resets to the start/end of array if 
            //the option allows
            if(this.settings.app.loopAtEnd){
                i += this.media.length;
                i %= this.media.length;
            }

            distance++;
            if(distance >= this.media.length){
                return undefined;
            }

            if(this.media[i].canPlay()){
                return this.media[i];
            }

        }
    }
    playPrevious(){ this.play(this.previous()); }
    
    /*
     * next returns the next valid media object
     * based on user settings
     */
    next() {

        var index = -1;
        var distance = 0;
        if (this.currentlyPlaying)
            index = this.currentlyPlaying.index;

        index++; //start at the next media straight away
        for(var i = index; i <= this.media.length; i++){

            //This resets to the start/end of array if 
            //the option allows
            if(this.settings.app.loopAtEnd){
                i += this.media.length;
                i %= this.media.length;
            }

            distance++;
            if(distance >= this.media.length){
                return undefined;
            }

            if(this.media[i].canPlay()){
                return this.media[i];
            }

        }
    }
    playNext(){ this.play(this.next()); }

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
                // element.style.height = "inherit";
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

        /*
         * Events
         */
        this.content.addEventListener('ended', this.onEnd);

        this.content.addEventListener('canplay', function(){
            document.body.appendChild(this.content);
            this.vidX = this.content.clientWidth;
            this.vidY = this.content.clientHeight;
            document.body.removeChild(this.content);
        }.bind(this));

    }

    select() {
        this.thumbnail.children[0].style.border = "2px solid white";
        this.thumbnail.children[0].style.opacity = "1";
        this.onSelect();
    }

    deselect() {
        this.thumbnail.children[0].style.border = "2px solid transparent";
        this.thumbnail.children[0].style.opacity = this.app.settings.ui.gallery.thumbnailOpacity;
    }

    onSelect(){
        this.refreshSize();
        if(window.app.settings.webm.autoStart)
            this.content.play();
    }

    onDeselect(){ 

    }

    onStart() {

    }

    onEnd() {
        window.app.next();
    }

    refreshSize(){
        if(this.vidX === undefined)
            this.vidX = this.content.clientWidth;
        if(this.vidY === undefined)
            this.vidY = this.content.clientHeight;

        var vidX = this.vidX;
        var vidY = this.vidY;
        var stageX = window.app.components.stage.clientWidth;
        var stageY = window.app.components.stage.clientHeight;

        var multi = stageX/vidX;
        vidX *= multi;
        vidY *= multi;

        var vidRatio = vidX/vidY;
        var stageRatio = stageX/stageY;

        if(vidRatio > stageRatio){
            this.content.style.height = "";
            this.content.style.width = "inherit";
        }else if(vidRatio < stageRatio){
            this.content.style.width = "";
            this.content.style.height = "inherit";
        }else{
            this.content.style.width = "inherit";
            this.content.style.height = "inherit";
        }

    }

    isVideo() {
        switch(this.type){
            case '.webm':
            case '.mp4':
            case '.gifv':
                return true;
            default:
                return false;
        }
    }

    canPlay(){
        switch(this.type){
            case '.webm':
            case '.mp4':
            case '.gifv':
                return window.app.settings.webm.include
                break;
            case '.jpg':
            case '.png':
                return window.app.settings.picture .include
                break;
            case '.gif':
                return window.app.settings.gif.include
                break;
            default:
                return false;
        }
    }
}

/*
 * solution for https://stackoverflow.com/questions/15617970/wait-for-css-transition
 * Provided by stackeroverflow user - "What have you tried"
 */
function whichTransitionEvent(){
    var t;
    var el = document.createElement('fakeelement');
    var transitions = {
      'transition':'transitionend',
      'OTransition':'oTransitionEnd',
      'MozTransition':'transitionend',
      'WebkitTransition':'webkitTransitionEnd'
    };

    for(t in transitions){
        if( el.style[t] !== undefined ){
            return transitions[t];
        }
    }
}

/**
 * Runs the specefied callback function until 
 * the condition function returns false
 * @param {Function} callback 
 * @param {Function} condition 
 */
var exampleFunc = function(){ console.error("Error: runUntil used without a function to run"); };
async function runUntil(callback = exampleFunc, condition = false, delay = 50){
    callback();
    if(condition())
        setTimeout(() => { runUntil(callback, condition); }, delay);
};