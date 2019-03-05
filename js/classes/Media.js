class Media {
    constructor(content, thumbnail) {

        this.playCount = 0;
        this.index = window.app.media.length;
        this.randomIndex = -1; //used when random is turned on

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

        //Create content's DOM element
        switch (this.type) {
            case ".jpg":
            case ".png":
            case ".gif":
                this.content = document.createElement("img");
                break;

            case ".webm":
            case ".mp4":
            case ".gifv":
                this.content = document.createElement("video");
                this.content.preload = window.app.settings.video.include ? "auto" : "none";
                this.content.controls = app.settings.video.controls;
                break;

            default:
                console.log("Content type was not caught");
                console.log(" when creating the element");
                console.log(type);
                break;
        }

        this.content.id = "sfc-now-playing";
        this.content.src = content;
        if(this.isVideo()){
            this.content.style.visibility = "hidden";
            this.content.style.transform = "translate(200vw, 200vh)";
            this.content.style.position = "absolute";
        }else{
            this.content.style.display = "none";
        }

        //Get duration
        if(this.isVideo()){
            
        }else if(this.isPicture()){

        }else if(this.isGif()){
        }

        /*
         * Create thumbnail element and assign onclick
         */

        //Create thumbnail
        let image = document.createElement("img");
        image.src = thumbnail;
        image.className = "sfc-thumbnail";

        //Create surrounding table cell
        this.thumbnail = document.createElement("td");
        this.thumbnail.appendChild(image);

        /*
         * Events
         */
        this.content.addEventListener('ended', this.onEnd.bind(this));
        this.thumbnail.addEventListener('click', function(){
            window.app.play(this);
        }.bind(this));
        this.content.addEventListener('loadeddata', function(){
            var validX = this.vidX !== 0 && this.vidX !== undefined;
            var validY = this.vidY !== 0 && this.vidY !== undefined;

            if(!validX)
                this.vidX = this.content.clientWidth;
            if(!validY)
                this.vidY = this.content.clientHeight;

            //Make sure to set styles if they haven't been set yet
            var isCurrentlyPlaying = window.app.currentlyPlaying === this;
            this.content.style.display = isCurrentlyPlaying ? "initial" : "none";
            this.content.style.visibility = "initial";
            this.content.style.transform = "translate(0px, 0px)";
            this.content.style.position = "initial";
        }.bind(this));

    }

    load(){
        // if(this.isVideo())
            // this.content.load();
    }

    select() {
        this.refreshSize(true);
        
        this.content.style.display = "block";
        this.thumbnail.children[0].style.border = "2px solid white";
        this.thumbnail.children[0].style.opacity = "1";
        
        //Restart content according to settings
        if(this.isVideo()){
            if(window.app.settings.video.restartOnSelect)
                this.content.currentTime = 0;
        }else if(this.isGif()){
            if(window.app.settings.gif.restartOnSelect)
                this.timer.cancel();
        }else if(this.isPicture()){
            if(window.app.settings.picture.restartOnSelect)
                this.timer.cancel();
        }
            
        if(window.app.settings.video.autoStart)
            this.play();
    }

    deselect() {
        this.content.style.display = "none";
        this.thumbnail.children[0].style.border = "2px solid transparent";
        this.thumbnail.children[0].style.opacity = window.app.settings.ui.gallery.thumbnailOpacity;
        this.pause();
    }

    play(){ 
        if(this.content){
            if(this.isVideo()){
                var videoSettings = window.app.settings.video;
                var volume = videoSettings.sound ? videoSettings.defaultVolume : 0;
                this.content.volume = volume;
                this.content.play();
            }else if(this.isGif()){
                if(this.timer === undefined || this.timer.complete){
                    this.timer = new Timer(this.onEnd.bind(this), window.app.settings.gif.duration);
                }else{
                    this.timer.resume();
                }
            }else if (this.isPicture()){
                if(this.timer === undefined || this.timer.complete){
                    this.timer = new Timer(this.onEnd.bind(this), window.app.settings.gif.duration);
                }else{
                    this.timer.resume();
                }
            }
        }
    }

    pause(){
        if(this.content){
            if((this.isGif() || this.isPicture) && this.timer)
                this.timer.pause();
            if(this.isVideo())
                this.content.pause();
        }
    }

    onDeselect(){ 

    }

    onStart() {

    }

    onEnd() {

        var endCase;

        if(this.isVideo()){
            endCase = window.app.settings.video.onend
        }else if(this.isGif()){
            endCase = window.app.settings.gif.onend
        }else if(this.isPicture()){
            endCase = window.app.settings.picture.onend
        }

        switch(endCase){
            case 1:
                //previous
                window.app.playPrevious();
                break;
            case 2:
                //thank you next
                window.app.playNext();
                break;
            case 3:
                //loop
                this.select();
                break;
            case 5:
                //exit
                window.app.play();
                window.app.toggleApp(false);
                break;
            default:
                //do nothing
                break;
        }
    }

    refreshSize(fixed){
        fixed = fixed === true ? true : false;
        var vidX = this.vidX;
        var vidY = this.vidY;

        var stageX = window.app.components.stage.clientWidth;
        var stageY = window.app.components.stage.clientHeight;

        var multi = stageX/vidX;
        vidX *= multi;
        vidY *= multi;

        var vidRatio = vidX/vidY;
        var stageRatio = stageX/stageY;

        var newX = "inherit";
        var newY = "inherit";

        if(vidRatio > stageRatio){
            //hit horizontal"
            // console.log("horizontal: X: inherit :: Y: " + newY);
            newX = fixed ? stageX + "px" : "100%";
            newY = "auto";
        }else if(vidRatio < stageRatio){
            //hit vertical
            // console.log("vertical: X: " + newX + " :: Y: inherit");
            newX = "auto";
            newY = fixed ? stageY + "px" :  "100%";
        }else{
            //hit both
            // console.log("both: X: inherit :: Y: inherit");
            newX = "inherit";
            newY = "inherit";
        }

        this.content.style.width = newX;
        this.content.style.height = newY;
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

    isGif() {
        return this.type === '.gif';
    }

    isPicture(){
        return this.type === '.jpg' || this.type === '.png';
    }

    canPlay(){
        switch(this.type){
            case '.webm':
            case '.mp4':
            case '.gifv':
                return window.app.settings.video.include
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