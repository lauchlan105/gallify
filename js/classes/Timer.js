class Timer {
    constructor(callback, delay){
        this.start;
        this.remaining = delay;
        this.complete = false;
        this.callback = callback;
        this.timerId;
        this.resume();
    }
    
    pause() {
        window.clearTimeout(this.timerId);
        this.remaining -= new Date() - this.start;
    };

    resume() {
        this.start = new Date();
        window.clearTimeout(this.timerId);
        this.timerId = window.setTimeout(function(){
            this.complete = true;
            this.callback();
        }.bind(this), this.remaining);
    };

    cancel(){
        window.clearTimeout(this.timerId);
        this.complete = true;
        this.callback();
    }

}