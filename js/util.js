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
 * Runs the specified callback function until 
 * the condition function returns false
 * @param {Function} callback 
 * @param {Function} condition 
 */
var exampleFunc = function(){ console.error("Error: runUntil used without a function to run"); };
async function runUntil(callback = exampleFunc, condition = false, delay = 50){
    return new Promise(async function(resolve, reject){
        callback();
        if(condition()){
            await new Promise((r, j)=>setTimeout(r, delay));
            await runUntil(callback, condition);
        }
        resolve();
    });
};
