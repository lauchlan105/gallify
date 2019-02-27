function getMedia(){

    var allMedia = [];
    var allContainers = document.getElementsByClassName("fileThumb");

    for(var i = 0; i < allContainers.length; i++){

        var currentCont = allContainers[i];

        if(currentCont.href == "" || currentCont.href === undefined)
            continue;

        var tempMedia = {};

        //Media url
        tempMedia.content = currentCont.href;

        //Loop children in search for img container
        for(var j = 0; j < currentCont.children.length; j++){
            if(currentCont.children[j].tagName.toUpperCase() === "IMG")
                tempMedia.thumbnail = currentCont.children[j].src;
        }

        allMedia.push(tempMedia);
    }
    
    return allMedia;
}