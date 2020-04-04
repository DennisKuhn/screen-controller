/**
 * Calculates the virtual screen rectangle by adding the bounds of each display
 * @module
 */
class ScreenRectangle {
    left = 0;
    top = 0;
    right = 0;
    bottom = 0;
    originDisplay = null;

    get width() {
        return this.right - this.left; 
    }
    get height() {
        return this.bottom - this.top; 
    }

    addDisplay(display) {
        console.log(display);
        const bounds = display.bounds;
        
        if (this.left > bounds.x) {
            this.left = bounds.x;
            this.originDisplay = display;
        }
        if (this.right < (bounds.x + bounds.width)) {
            this.right = (bounds.x + bounds.width);
        }
        if (this.top > bounds.y) {
            this.top = bounds.y;
        }
        if (this.bottom < (bounds.y + bounds.height)) {
            this.bottom = (bounds.y + bounds.height);
        }
        console.log(`${display.id}: ${display.scaleFactor}* ${bounds.width} x ${bounds.height} @ ${bounds.x}, ${bounds.y} => ${this.width} x ${this.height} ${JSON.stringify(this)}`);
    }
}

module.exports = ScreenRectangle;
