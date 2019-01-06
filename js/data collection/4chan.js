function getMedia(){

    var allMedia = [];
    var allContainers = document.getElementsByClassName("fileThumb");

    for(var i = 0; i < allContainers.length; i++){

        var currCont = allContainers[i];
        var tempMedia = {};

        //Media url
        tempMedia.content = currCont.href;

        //Loop children in search for img container
        for(var j = 0; j < currCont.children.length; j++){
            if(currCont.children[j].tagName.toUpperCase() === "IMG")
                tempMedia.thumbnail = currCont.children[j].src;
        }

        allMedia.push(tempMedia);
    }
    
    return allMedia;
}