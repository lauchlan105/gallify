chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        switch (request.function) {
            case "getFile":
                getFile(request.args).then(function (response) {
                    sendResponse({
                        message: response.response
                    });
                });
                return true;
                break;
            default:
                console.error(request);
                break;
        }
    }
);

function sendMessage(message, recipient) {
    chrome.tabs.sendMessage(recipient.tab.id, {
        response: message
    }, function () {});
}

console.log(chrome.extension.getViews());

function getFile(path) {

    return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function (event) {
            if (event.target.readyState == 4) {
                resolve(event.target);
            }
        };
        xhr.open("GET", path);
        xhr.send();
    });

}