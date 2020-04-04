
/**
 * Handles drawing on screen
 */
export default class DrawController {
    constructor(cbOnNewPoints) {
        this._enabled = true;
        this.minMovementToShow = 10;
        this.startMovement = 0;
        this.lastX = null;
        this.lastY = null;
        this.onShow = null;
        this.onHide = null;

        this.shown = false;

        this.onNewPoints = cbOnNewPoints;
        this.mouseDown = false;
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.processor = null;

        window.addEventListener('mousemove', e => this.onMouseMove(e) );
        window.addEventListener('mousedown', e => this.onMouseDown(e) );
        window.addEventListener('mouseup',   e => this.onMouseUp(e)   );
    }

    get points() {
        if (this.processor)
            return this.processor.points;
        else
            return [];
    }

    get smooth() {
        if (this.processor)
            return this.processor.Smooth;
        else
            return false;
    }

    /**
     * En/Dis-ables the controller. When changing from enabled to disabled,
     * this.empty() is called. When disabled, all mouse events are ignored.
     * @param {boolean} enable 
     * @returns {boolean} previous enable state
     */
    setEnabled(newEnable) {
        const oldEnabled = this._enabled;

        if (oldEnabled != newEnable) {
            this._enabled = newEnable;

            if (newEnable) {
            } else {
                if (this.processor) {
                    this.processor.reset();
                }
                this.startMovement = null;
                this.mouseDown = false;
            }
        }
        return oldEnabled;
    }

    get enabled() {
        return this._enabled; 
    }
    set enabled(newEnable) {
        this.setEnabled(newEnable); 
    }

    get OnNewPoints() {
        return onNewPoints;
    }

    set OnNewPoints(cbOnNewPoints ) {
        this.onNewPoints = cbOnNewPoints;
    }

    get OnShow() {
        return this.onShow;
    }

    set OnShow(cbOnShow ) {
        this.onShow = cbOnShow;
    }

    get OnHide() {
        return this.onHide;
    }

    set OnHide( cbOnHide ) {
        this.onHide = cbOnHide;
    }

    get Shown() {
        return this.shown; 
    }

    Show() {
        // console.log("DrawController.Show()");
        if ( this.onShow ) {
            this.onShow();
        } else {
            console.error( 'DrawController.Show: no onShow');    
        }
        this.shown = true;
    }

    Hide() {
        // console.log("DrawController.Hide()");
        if ( this.onHide ) {
            this.onHide();
        } else {
            console.error( 'DrawController.Hide: no onHide');    
        }
        this.shown = false;
    }

    updatePoints( detail ) {
    }

    /**
     * 
     * @param {MouseEvent} e 
     */
    onMouseMove( e ) {
        if (this._enabled && this.mouseDown) {
            // Measure initial start movement and call this.Show() once
            // >= this.minMovementToShow
            if (this.startMovement != null) {
                this.startMovement += Math.abs( this.lastX - e.clientX ) + Math.abs( this.lastY - e.clientY );
                this.lastX = e.clientX;
                this.lastY = e.clientY;
    
                if (this.startMovement >= this.minMovementToShow) {
                    // console.log("onMouseMove() call Show");
                    this.startMovement = null;
                    this.Show();
                }
            }
            this.processor.mouseMove(e.clientX, e.clientY);
        } else {
            // console.log("onMM() en=" + this._enabled + " mseD=" + this.mouseDown + " strtMov=" + this.startMovement);
        }
    }

    onMouseDown( e ) {
        // console.log("DrawController(" + typeof this + ").onMouseDown(e.clientX=" + e.clientX + ", e.clientY=" + e.clientY +" ) width=" + this.width + " height=" + this.height);

        const onScreen = e.clientX >= 0 && e.clientY >= 0 && e.clientX < this.width && e.clientY < this.height;


        if (onScreen && this._enabled) {
            this.mouseDown = true;
            this.startMovement = 0;
            this.lastX = e.clientX;
            this.lastY = e.clientY;
            this.processor = drawProcessorFactory.get();
            // console.log("DrawController.onMouseDown(" + e.clientX + ", " + e.clientY +" ) call processMouseDown");
            this.processor.mouseDown(e.clientX, e.clientY);
        }
    }

    onMouseUp( e ) {
        // console.log("onMouseUp("+e.clientX+", "+e.clientY+") enabled=" + this._enabled + " shown=" + this.shown );
        if (this.mouseDown) {
            this.mouseDown = false;
            if (this.shown) {
                this.Hide();
                const drawing = this.processor.mouseUp(e.clientX, e.clientY);

                if (this.onNewPoints) {
                    // console.log("onMouseUp() drawing.length=" + drawing.length );
                    this.onNewPoints(drawing);
                } else {
                    console.error('DrawController.onMouseUp() no OnNewPoints');
                }
            }
            if ( this.processor )
                this.processor.reset();
        }
    }
}

