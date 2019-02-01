
objects = null;

(function main() {
    objects = initElements();

    if (!objects) return;

    initEvents();
    initStyles();
    initTabPages();

    //Virtually click on the first tab
    objects.navButtons[0].onclick(null, objects.navButtons[0]);

})();

function initStyles() {

}

function initEvents() {

    //Tab button events
    for (var i = 0; i < objects.navButtons.length; i++) {
        objects.navButtons[i].onclick = (event, target = event.target) => { openTab(target); };
    }

}

function openTab(target) {

    /*
     * Change selected tab button
     */

    var previouslySelected = 0;
    var newSelectedTab = 0;

    for (var i = 0; i < objects.navButtons.length; i++) {
        //if target id == button's id
        if (target.id == objects.navButtons[i].id) {
            newSelectedTab = i;
            target.classList.add("selected");
            continue;
        }

        //If it was selected, assign i to previouslySelected and remove selected class
        if (objects.navButtons[i].classList.contains("selected")) {
            previouslySelected = i;
            objects.navButtons[i].classList.remove("selected");
            continue;
        }
    }

    /*
     * Change the displayed tab
     */
    var popupWidth = document.getElementById("sfc-settings-html").clientWidth;
    objects.tabWindow.style.transform = "translateX(" + (0 - (popupWidth * newSelectedTab)) + "px)";
}

function initElements() {

    var objects = {};
    var errors = [];

    function find(elemID) {
        var temp = document.getElementById(elemID);
        if (temp == null || temp == undefined) {
            errors.push(" Could not find element '" + elemID + "'");
        }

        return temp;
    }

    //Tab buttons
    //Set to navbar children if navbar is found
    objects.navButtons = document.getElementById("sfc-navbar") ?
        document.getElementById("sfc-navbar").children : [];

    //Tab Windows
    objects.tabWindow = document.getElementById("sfc-tabWindow");

    //Print all errors
    for (let i in errors) { console.error(errors[i]); }

    //Return false if errors
    return errors.length == 0 ? objects : false;

}

function initTabPages() {

    var tabWindow = document.getElementById("sfc-tabWindow");
    var tabPages = getChildrenByClassName(tabWindow, "tabPage");

    //Parse through option-group elements
    function getOptions(optGroupEl) {

        var tempOption = {
            triggerElement: undefined,
            subOptions: undefined
        }

        var children = optGroupEl.children;

        if (children.length !== 2) {
            console.error("The following 'option group' does not meet required layout");
            console.error(optGroupEl);
            return;
        }

        //Find sub-options
        var subOptions = getChildrenByClassName(children[1], "option-group");

        for (var i = 0; i < subOptions.length; i++) {
            subOptions[i] = getOptions(subOptions[i]);
        }

        //Find form input element
        var optionDiv = children[0];
        var spanDivs = getChildrenByTagName(optionDiv, "span");

        if (spanDivs.length != 1) {
            console.error("The following 'option' must have a span element");
            console.error(optionDiv);
            return;
        }

        var spanDiv = spanDivs[0];
        var triggerElement = getChildrenByTagName(spanDiv, ["input", "select"]);

        if (triggerElement.length != 1) {
            console.error("The following 'span' must have exactly one form element");
            console.error(spanDiv);
        }

        triggerElement = triggerElement[0];

        triggerElement.onchange = function (event, input) {

            var input = event == null ? input : event.target;
            var optionDiv = input.parentElement.parentElement;
            var optionGroupDiv = optionDiv.parentElement;
            var subOptions = getChildrenByClassName(optionGroupDiv, "sub-options")

            if(subOptions.length != 1){
                console.error("The following option requires a 'sub-options' div")
                console.error(optionGroupDiv);
            }
            
            subOptions = subOptions[0].children;

            function showSubOption(value) {

                for (var i = 0; i < subOptions.length; i++) {
                    
                    subOptions[i].style.display = "none";
                    if (subOptions[i].attributes.for.value == value)
                        subOptions[i].style.display = "block";

                }

            }

            //Switch to change what value is used for switching sub-options
            switch (input.type) {
                case "select-one":
                    showSubOption(input.value);
                    break;

                case "checkbox":
                    showSubOption(input.checked ? "true" : "false");
                    break;

                default:
                    console.error("Input has no method: " + input.type);
                    break;
            }

        }
        //Call onchange to apply hide/show any loaded stuff
        triggerElement.onchange(null, triggerElement);

        tempOption.triggerElement = triggerElement;
        tempOption.subOptions = subOptions;

        return tempOption;
    }

    for (var i = 0; i < tabPages.length; i++) {
        var options = getChildrenByClassName(tabPages[i], "option-group");

        for (var j = 0; j < options.length; j++) {
            options[j] = getOptions(options[j]);
        }

        tabPages[i].options = options;
    }


}

function getChildrenByClassName(el, className) {
    var children = el.children;
    var target = [];

    if (Array.isArray(className)) {

        for (var i = 0; i < children.length; i++) {

            for (var j = 0; j < className.length; j++) {
                if (children[i].className == className[j])
                    target.push(children[i]);
            }

        }

    } else {

        for (var i = 0; i < children.length; i++) {
            if (children[i].className == className)
                target.push(children[i]);
        }

    }

    return target;
}

function getChildrenByTagName(el, tagName) {
    var children = el.children;
    var target = [];

    if (Array.isArray(tagName)) {
        for (var i = 0; i < children.length; i++) {
            for (var j = 0; j < tagName.length; j++) {
                if (children[i].tagName.toLowerCase() == tagName[j])
                    target.push(children[i]);
            }
        }
    } else {
        for (var i = 0; i < children.length; i++) {
            if (children[i].tagName.toLowerCase() == tagName)
                target.push(children[i]);
        }
    }

    return target;
}