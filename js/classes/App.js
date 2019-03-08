class App {

    constructor(html, json) {

        window.app = this;

        this.components = {};
        this.media = undefined;
        this.currentlyPlaying = undefined;
        this.loading = true;
        this.settings = JSON.parse(json);

        this.mediaLoaded = {};
        this.mediaLoaded.gif = 0;
        this.mediaLoaded.video = 0;
        this.mediaLoaded.picture = 0;

        this.mediaToLoad = {};
        this.mediaToLoad.gif = 0;
        this.mediaToLoad.video = 0;
        this.mediaToLoad.picture = 0;

        this.randomQueue = [];

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
        objects.loading = find("sfc-loading");

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

        this.components.app.style.display = "none";
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
        this.components.gallery.addEventListener(whichTransitionEvent(), function () {
            window.app.components.gallery.transitioning = false;
        });

        //Buttons
        this.components.galleryButton.addEventListener('click', function (e) {
            window.app.toggleGallery();
        })
        this.components.left.addEventListener('click', function (e) {
            window.app.playPrevious();
        });
        this.components.right.addEventListener('click', function (e) {
            window.app.playNext();
        });

        //Events to close app by clicking background
        this.components.stage.addEventListener('click', function (e) {
            if (e.target === window.app.components.stage)
                window.app.toggleApp(false);
        });
        this.components.stageParent.addEventListener('click', function (e) {
            if (e.target === window.app.components.stageParent)
                window.app.toggleApp(false);
        });
        this.components.gallerySlider.addEventListener('click', function (e) {
            if (e.target === window.app.components.gallerySlider)
                window.app.toggleApp(false);
        });

        window.onkeyup = function (e) {
            switch (e.keyCode) {
                case 32: //space
                    window.app.settings.video.include = !window.app.settings.video.include;
                    window.app.applySettings();
                    break;
                case 82: //R
                    (function () {
                        var validX = this.vidX !== 0 && this.vidX !== undefined;
                        var validY = this.vidY !== 0 && this.vidY !== undefined;

                        if (!validX)
                            this.vidX = this.content.clientWidth;
                        if (!validY)
                            this.vidY = this.content.clientHeight;

                        //Make sure to set styles if they haven't been set yet
                        var currentlyPlaying = window.app.currentlyPlaying === this;
                        this.content.style.display = currentlyPlaying ? "initial" : "none";
                        this.content.style.visibility = "initial";
                        this.content.style.transform = "translate(0px, 0px)";
                        this.content.style.position = "initial";
                    }).bind(window.app.currentlyPlaying)();
                    break;
                case 69:
                    window.app.alignGallery();
                    break;
            }
        };

        this.toggleApp(this.settings.app.openOnStart);

    }

    /*
     * fetchMedia runs the relevant getMedia function found under the
     * 'data collection' directory. It then creates all the media objects necessary
     */
    fetchMedia() {

        window.app.media = [];

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

            if (temp.isVideo()) {
                window.app.mediaToLoad.video++;
                temp.content.addEventListener('loadeddata', () => {
                    window.app.mediaLoaded.video++;
                });
            } else if (temp.isGif()) {
                window.app.mediaToLoad.gif++;
                window.app.mediaLoaded.gif++;
            } else if (temp.isPicture()) {
                window.app.mediaToLoad.picture++;
                window.app.mediaLoaded.picture++;
            }

            temp.count.gif = window.app.mediaToLoad.gif;
            temp.count.picture = window.app.mediaToLoad.picture;
            temp.count.video = window.app.mediaToLoad.video;

            this.media.push(temp);
            window.app.components.galleryTableRow.appendChild(temp.thumbnail);
            window.app.components.stage.appendChild(temp.content);
        }

        return true;
    }

    waitForMedia() {
        return new Promise(async function (resolve, reject) {
            var wasPlaying = window.app.currentlyPlaying;
            if (wasPlaying !== undefined) {
                window.app.play();
            }

            if (wasPlaying !== undefined && !wasPlaying.canPlay())
                wasPlaying = window.app.next(wasPlaying);

            window.app.toggleLoad(true);

            await runUntil(() => {}, () => {
                if (window.app.media === undefined)
                    return true;

                var loaded = window.app.mediaLoaded;
                var totalLoaded = loaded.gif + loaded.video + loaded.video;
                var totalToLoad = 0;

                if (window.app.settings.video.include)
                    totalToLoad += window.app.mediaToLoad.video

                if (window.app.settings.gif.include)
                    totalToLoad += window.app.mediaToLoad.gif

                if (window.app.settings.picture.include)
                    totalToLoad += window.app.mediaToLoad.picture

                return totalLoaded < totalToLoad * window.app.settings.app.percentageToLoad;
            }, 50);

            window.app.toggleLoad(false);
            window.app.play(wasPlaying);
            resolve();
        });
    }

    refreshCounter() {
        var index = " - ";
        var total = " - ";

        if (this.currentlyPlaying !== undefined && this.currentlyPlaying.canPlay()) {
            index = 0;
            if (this.settings.picture.include)
                index += this.currentlyPlaying.count.picture;

            if (this.settings.gif.include)
                index += this.currentlyPlaying.count.gif;

            if (this.settings.video.include)
                index += this.currentlyPlaying.count.video;    
        }

        total = 0;
        if (this.settings.picture.include)
            total += this.mediaToLoad.picture;

        if (this.settings.gif.include)
            total += this.mediaToLoad.gif;

        if (this.settings.video.include)
            total += this.mediaToLoad.video;

        window.app.components.counter.innerHTML = index + "/" + total;
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

        //set preload on videos if not all videos have been loaded
        if (window.app.mediaLoaded.video < window.app.mediaToLoad.video) {
            this.waitForMedia();
            for (var i in window.app.media) {
                var media = window.app.media[i];
                if (media.isVideo() && media.canPlay()) {
                    if (media.content.preload !== "auto")
                        media.content.preload = "auto";
                }
            }
        }

        /* 
         * Gallery
         */
        var halfGalleryHeight = (thumbnailHeight / 2) + thumbnailBorder + thumbnailSpacing;
        components.galleryButton.style.bottom = halfGalleryHeight - (buttonSize / 2) + "px";

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
        components.galleryCurtain.left.style.background = color;
        components.galleryCurtain.left.style.background = "-webkit-linear-gradient(to right, " + color + " -20%, transparent)";
        components.galleryCurtain.left.style.background = "linear-gradient(to right, " + color + " -20%, transparent)";
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
        console.log(ui.counter.fontSize * ui.base + "px");
        components.counter.style.fontSize = ui.counter.fontSize * base + "px";
        components.counterTotal.style.fontSize = ui.counter.fontSize + "px";
        components.counterIndex.style.fontSize = ui.counter.fontSize + "px";

        this.resetRandomQueue();
        this.refreshGallery();
        this.components.app.style.display = "block";
    }

    resetRandomQueue() {

        //reset randomIndex for all media
        for (var i in this.media) {
            var media = this.media[i];
            media.randomIndex = -1;
        }

        //clear random queue
        this.randomQueue = [];

        //set randomIndex and push to queue if the
        //random queue is being used
        if (!this.settings.app.playRandom) {
            if (this.currentlyPlaying) {
                this.currentlyPlaying.randomIndex = this.randomQueue.length - 1;
                this.randomQueue.push(this.currentlyPlaying);
            }
        }

    }

    /*
     * toggleApp shows/hides the app
     */
    toggleApp(show) {

        var app = this.components.main;
        var autoStart = this.settings.app.autoStart;
        if (show === true) {
            app.style.display = "block";
            document.body.style.overflow = "hidden";
        } else if (show === false) {
            app.style.display = "none";
            document.body.style.overflow = "auto";
        } else if (show !== undefined) {
            console.log(show);
            return;
        } else {
            this.toggleApp(app.style.display !== "block");
            return;
        }

        this.alignGallery();

        if (autoStart && show === true &&
            this.currentlyPlaying === undefined) {
            this.waitForMedia().then(() => {
                setTimeout(window.app.playNext.bind(window.app), 100);
            });
        }

    }

    toggleLoad(show) {
        if (show === true) {
            window.app.components.loading.style.display = "flex";
            window.app.loading = true;
        } else if (show === false) {
            window.app.components.loading.style.display = "none";
            window.app.loading = false;
        } else if (show !== undefined) {
            console.log(show);
            return;
        } else {
            window.app.toggleLoad(window.app.components.loading.style.display === "none");
        }
    }

    /*
     * toggleGallery shows/hides the gallery
     */
    toggleGallery(show) {
        let gallery = this.components.gallery;
        let settings = this.settings.ui.gallery;
        let base = this.settings.ui.size; //base ui size

        //Runs the callback function till the condition
        //returns false with a delay specified as such.
        //Finally sets the media dimensions to a pixel
        //value rather than 100% or inherit
        function refresh() {
            if (window.app.currentlyPlaying !== undefined)
                window.app.currentlyPlaying.refreshSize();
            runUntil(
                //callback
                () => {},
                //condition
                () => {
                    return window.app.components.gallery.transitioning;
                },
                //delay & finally
                100).finally(
                () => {
                    if (window.app.currentlyPlaying !== undefined)
                        window.app.currentlyPlaying.refreshSize(true);
                }
            );
        }

        if (show === true) { //Show gallery

            let showingHeight = (base * settings.thumbnailHeight) +
                (base * settings.thumbnailBorder * 2) +
                (base * settings.thumbnailSpacing * 2);
            gallery.style.height = showingHeight + "px";

            gallery.transitioning = true;
            refresh();

        } else if (show === false) { //Hide gallery
            gallery.style.height = "0px";
            gallery.transitioning = true;
            refresh();
        } else if (show !== undefined) {
            console.log(show);
            return;
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
        if (alignTo === undefined && window.app.media !== undefined) {
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

    refreshGallery() {
        var allMedia = window.app.media;
        if (allMedia) {
            for (var i in allMedia) {
                //set thumbnail display to initial or none based on canPlay()
                allMedia[i].thumbnail.hidden = !allMedia[i].canPlay();
            }
        }
        this.alignGallery();
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

        if (window.app.loading)
            return

        var hasMedia = media !== undefined;
        var random = this.settings.app.playRandom;
        var stage = this.components.stage;
        var wasPlaying = this.currentlyPlaying;

        //error if media has been parsed and it is not a Media object
        if (hasMedia && !(media instanceof Media)) {
            console.error("Invalid media:");
            console.error(media);
            return;
        }

        //return if playing the same thing
        if (media === this.currentlyPlaying)
            return;

        //deselect currentlyPlaying
        if (this.currentlyPlaying) {
            this.currentlyPlaying.deselect();
            this.currentlyPlaying = undefined;
        }

        //return after deselecting if no media has been parsed
        if (!hasMedia){
            this.refreshCounter();
            return;
        }

        //add to randomQueue if needed
        if (random) {

            //playingThroughQueue is set to true by default if the first item
            //in the randomQueue is to be played.
            var playingThroughQueue = wasPlaying === undefined && this.randomQueue.length > 0;
            if (wasPlaying !== undefined && media.randomIndex !== -1) {
                //play through is true if the media to be played is adjacent
                // in the array to what is currently playing
                var prevOfCurrent = media.randomIndex === wasPlaying.randomIndex - 1;
                var nextOfCurrent = media.randomIndex === wasPlaying.randomIndex + 1;
                playingThroughQueue = prevOfCurrent || nextOfCurrent;
            }

            //remove from queue first if it is there
            if (!playingThroughQueue && this.randomQueue.includes(media)) {

                //filter media from randomQueue
                this.randomQueue = this.randomQueue.filter(function (randomMedia) {
                    return randomMedia !== media;
                });

                //reset randomIndex
                for (var i in this.randomQueue) {
                    if (isNaN(i))
                        continue;
                    var i = parseInt(i);
                    var randomMedia = this.randomQueue[i];
                    randomMedia.randomIndex = i;
                }

            }

            //set randomIndex and add to randomQueue
            if (!playingThroughQueue) {
                media.randomIndex = this.randomQueue.length;
                this.randomQueue.push(media);
            }


        }


        //Play media if parsed
        this.currentlyPlaying = media;
        this.currentlyPlaying.select();
        stage.appendChild(media.content);

        // Load previous and next content
        var p = this.previous();
        if (p !== undefined)
            p.load();

        if (!window.app.settings.app.playRandom) {
            var n = this.next();
            if (n !== undefined)
                n.load();
        }

        this.alignGallery();
        this.refreshCounter();
    }

    /*
     * previous returns the previous valid media object
     * based on user settings
     */
    previous(media) {

        if (media !== undefined && !(media instanceof Media)) {
            console.error("Error: can't get previous. Media was invalid");
            console.error(media);
            return undefined;
        }

        //return media from previous spot in randomQueue if random play is on
        if (window.app.settings.app.playRandom) {

            if (this.currentlyPlaying === undefined)
                return undefined;

            //if the current media is in the randomQueue, go backwards
            var randomIndex = this.currentlyPlaying.randomIndex;
            return randomIndex >= 1 ? this.randomQueue[randomIndex - 1] : undefined;

        }

        var hasMedia = media !== undefined;
        var index = hasMedia ? media.index : 0;
        var distance = 0;

        if (this.currentlyPlaying !== undefined && !hasMedia)
            index = this.currentlyPlaying.index;

        index--; //start at the previous media straight away
        for (var i = index; i < this.media.length; i--) {
            //This resets to the start/end of array if 
            //the option allows

            var looped = i < 0 || this.media.length <= i;
            var shouldLoop = this.settings.app.loopAtEnd;
            if (looped && !shouldLoop) {
                return undefined;
            }

            i += this.media.length;
            i %= this.media.length;

            distance++;
            if (distance >= this.media.length) {
                return undefined;
            }

            if (this.media[i].canPlay()) {
                return this.media[i];
            }

        }
    }
    playPrevious(media) {
        this.play(this.previous(media));
    }

    /*
     * next returns the next valid media object
     * based on user settings
     */
    next(media) {

        if (media !== undefined && !(media instanceof Media)) {
            console.error("Error: can't get next. Media was invalid");
            console.error(media);
            return undefined;
        }

        if (window.app.settings.app.playRandom) {

            var randomQueueLength = this.randomQueue.length;

            //if nothing is being played, play next in randomQueue, or if nothing -> random()
            if (this.currentlyPlaying === undefined)
                return randomQueueLength > 0 ? this.randomQueue[0] : this.random();

            //if the current media is in the randomQueue, play next in queue or random()
            var randomIndex = this.currentlyPlaying.randomIndex;
            var inQueue = randomIndex !== -1;
            var endOfQueue = randomIndex === randomQueueLength - 1;

            if (inQueue && !endOfQueue)
                return this.randomQueue[randomIndex + 1];

            return this.random();

        }

        var index = media === undefined ? this.media.length - 1 : media.index;
        var distance = 0;
        if (this.currentlyPlaying && media === undefined)
            index = this.currentlyPlaying.index;

        index++; //start at the next media straight away
        for (var i = index; i <= this.media.length; i++) {
            //This resets to the start/end of array if 
            //the option allows

            var looped = i < 0 || this.media.length <= i;
            var shouldLoop = this.settings.app.loopAtEnd;
            if (looped && !shouldLoop) {
                return undefined;
            }

            i += this.media.length;
            i %= this.media.length;

            if (distance >= this.media.length) {
                return undefined;
            }
            distance++;

            var validIndex = 0 <= i && i <= window.app.media.length - 1;
            if (validIndex) {
                if (this.media[i].canPlay())
                    return this.media[i];
            }

        }
    }
    playNext(media) {
        this.play(this.next(media));
    }

    random() {

        if (window.app.media === undefined || window.app.media.length < 1)
            return;

        var output = undefined;
        var min = 0;
        var max = window.app.media.length - 1;

        for (var i in window.app.media) {
            var index = Math.random() * (max - min) + min;
            index = Math.floor(index);
            var media = window.app.media[index];

            if (media === window.app.currentlyPlaying)
                continue;

            if (output === undefined) {
                output = media;
                continue;
            }

            if (output.playCount < media.playCount) {
                output = media;
                continue;
            }

        }

        return output;

    }

}