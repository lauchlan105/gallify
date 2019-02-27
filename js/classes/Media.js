class Media {
    constructor(content, thumbnail) {

        this.playCount = 0;
        this.index = window.app.media.length;

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

        if(this.isVideo()){
            var el = document.createElement("video");
            el.src = element.src;
            el.preload = "auto";
            el.id = element.src;

            document.body.appendChild(el);
            function test(el){
                this.vidX = el.clientWidth;
                this.vidY = el.clientHeight;
                document.body.removeChild(el);
            }

            el.addEventListener('loadeddata', function(e){
                test = test.bind(this);
                test(e.target);
            }.bind(this));
        }

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
            window.app.play(obj);
        };

        this.thumbnail = tableData;

        /*
         * Events
         */
        this.content.addEventListener('ended', this.onEnd.bind(this));

        this.content.addEventListener('loadeddata', function(){
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
        this.thumbnail.children[0].style.opacity = window.app.settings.ui.gallery.thumbnailOpacity;
    }

    play(){ 
        if(this.content){
            if(this.isVideo()){
                var videoSettings = window.app.settings.webm;
                var volume = videoSettings.sound ? videoSettings.defaultVolume : 0;
                this.content.volume = volume;
                this.content.play();
            }
        }
    }

    pause(){
        if(this.content)
            this.content.pause();
    }

    onSelect(){
        this.refreshSize(true);
        if(window.app.settings.webm.restartOnSelect)
            this.content.currentTime = 0;
        if(window.app.settings.webm.autoStart)
            this.play();
    }

    onDeselect(){ 

    }

    onStart() {

    }

    onEnd() {
        if(this.isVideo()){
            switch(window.app.settings.webm.onend){
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
                case 4:
                    //nothing
                    break;
                case 5:
                    //exit
                    window.app.play();
                    window.app.toggleApp(false);
                    break;
            }
            console.log(this.playCount);
        }else if(this.isGif()){

        }else if(this.isPicture()){

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

        // var newX = fixed ? stageX + "px" : "";
        // var newY = fixed ? stageY + "px" : "";

        // console.log(newX + ":" + newY);

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