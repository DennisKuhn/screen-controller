'use strict';

/**
 * Base class for all processors like DrawSquare, DrawScribble, 
 */
class DrawProcessor {
    constructor() {
        this.points = [];
        this.startX = null;
        this.startY = null;
        this.currentX = null;
        this.currentY = null;
        this.endX = null;
        this.endY = null;

        this.smooth = false;
    }

    reset() {
        this.points = [];
        this.startX = null;
        this.startY = null;
        this.currentX = null;
        this.currentY = null;
        this.endX = null;
        this.endY = null;
    }

    get Smooth() {
        return this.smooth; 
    }

    mouseDown(x, y) {
        this.points = [];
        this.currentX = this.startX = x;
        this.currentY = this.startY = y;
        this.endX = null;
        this.endY = null;

        this.processMouseDown();
    }

    mouseMove(x, y) {
        this.currentX = x;
        this.currentY = y;

        this.processMouseMove();
    }

    /**
     * Finish drawing process and return drawing.
     * @param {int} x 
     * @param {int} y 
     * @returns {[]} Points of the drawing
     */
    mouseUp(x, y) {
        this.currentX = this.endX = x;
        this.currentY = this.endY = y;

        this.processMouseUp();

        return this.points;
    }

    processMouseMove() {
        console.error('DrawProcessor(' + this.constructor.name + ') no processMouseMove');
    }
    processMouseDown() {
        // console.error("DrawProcessor(" + this.constructor.name + ") no processMouseDown");
    }
    processMouseUp() {
        console.error('DrawProcessor(' + this.constructor.name + ') no processMouseUp');
    }

}

/**
 * @extends DrawProcessor
 */
class DrawSquare extends DrawProcessor {
    updatePoints( detail ) {
        let dx = this.currentX - this.startX;
        let dy = this.currentY - this.startY;
        const r = ( Math.abs(dx) + Math.abs(dy) ) / 2;
        dx = dx / Math.abs( dx );
        dy = dy / Math.abs( dy );
        
        this.points = [];
        this.points.push( { x: this.startX+r*dx/2, y: this.startY+r*dy, d: true } );
        this.points.push( { x: this.startX+r*dx, y: this.startY+r*dy,   d: true } );
        this.points.push( { x: this.startX+r*dx, y: this.startY, 	  d: true } );
        this.points.push( { x: this.startX, 	 y: this.startY, 	  d: true } );
        this.points.push( { x: this.startX, 	 y: this.startY+r*dy, d: true } );
        this.points.push( { x: this.startX+r*dx/2, y: this.startY+r*dy, d: true } );
    }
    
    processMouseMove() {
        this.updatePoints( 60 );
    }

    processMouseUp() {
        this.updatePoints( 1080 );
    }
}

/**
 * @extends DrawProcessor
 */
class DrawRect extends DrawProcessor {
    updatePoints( detail ) {
        const dx = this.currentX - this.startX;
        const dy = this.currentY - this.startY;
        
        this.points = [];
        this.points.push( { x: this.startX+dx/2, y: this.startY+dy, d: true } );
        this.points.push( { x: this.startX+dx, y: this.startY+dy, d: true } );
        this.points.push( { x: this.startX+dx, y: this.startY, d: true } );
        this.points.push( { x: this.startX, y: this.startY, d: true } );
        this.points.push( { x: this.startX, y: this.startY+dy, d: true } );
        this.points.push( { x: this.startX+dx/2, y: this.startY+dy, d: true } );
    }
    
    processMouseMove() {
        this.updatePoints( 60 );
    }

    processMouseUp() {
        this.updatePoints( 1080 );
    }
}

/**
 * @extends DrawProcessor
 */
class DrawCircle extends DrawProcessor {
    updatePoints( detail ) {
        const dx = this.currentX - this.startX;
        const dy = this.currentY - this.startY;
        const r = Math.sqrt( dx*dx + dy*dy );
        
        const radBase = Math.atan2( dx, dy );
        this.points = [];
        for ( let i = 0; i <= detail; i++ ) {
            const rad = Math.PI*2 * i / detail;
            this.points.push( { x: Math.sin(rad+radBase)*r+this.startX, y: Math.cos(rad+radBase)*r + this.startY, d: true } );
        }
    }
    
    processMouseMove() {
        this.updatePoints( 60 );
    }
    processMouseUp() {
        this.updatePoints( 1080 );
    }
}

/**
 * @extends DrawProcessor
 */
class DrawOval extends DrawProcessor {
    updatePoints( detail ) {
        const dx = this.currentX - this.startX;
        const dy = this.currentY - this.startY;
        const rx = Math.abs( dx );
        const ry = Math.abs( dy );
        
        const radBase = Math.atan2( 0, dy );
        
        this.points = [];
        for ( let i = 0; i <= detail; i++ ) {
            const rad = Math.PI*2 * i / detail;
            this.points.push( { x: Math.sin(rad+radBase)*rx+this.startX, y: Math.cos(rad+radBase)*ry + this.startY, d: true } );
        }
    }
    
    processMouseMove() {
        this.updatePoints( 60 );
    }

    processMouseUp() {
        this.updatePoints( 1080 );
    }
}

/**
 * @extends DrawProcessor
 */
class DrawLine extends DrawProcessor {
    processMouseMove() {
        if ( this.points.length > 1 ) 
            this.points.shift() ;

        this.points.unshift( { x: this.currentX, y: this.currentY, d: true } ) ;

        return this.points;
    }
    processMouseDown() {
        this.points.unshift( { x: this.startX, y: this.startY, d: true } ) ;
    }
    processMouseUp() {
        if ( this.points.length > 1 ) this.points.shift() ;
        this.points.unshift( { x: this.endX, y: this.endY, d: false } ) ;
    }
}

/**
 * @extends DrawProcessor
 */
class DrawScribble extends DrawProcessor {
    constructor() {
        super();
        this.smooth = true;
    }

    processMouseMove() {
        this.points.unshift( { x: this.currentX, y: this.currentY, d: true } ) ;
    }
    processMouseDown() {
        this.points.unshift( { x: this.startX, y: this.startY, d: true } ) ;
    }

    processMouseUp() {
        this.points.unshift( { x: this.endX, y: this.endY, d: false } ) ;
    }
}

/**
 * List of DrawProcessors manufactured by DrawProcessorFactory
 */
export const DRAWPROCESSORS = {
    Scribble:   () => {
        return new DrawScribble();  
    },
    Line:       () => {
        return new DrawLine();      
    },
    Oval:       () => {
        return new DrawOval();      
    },
    Circle:     () => {
        return new DrawCircle();    
    },
    Rect:       () => {
        return new DrawRect();      
    },
    Square:     () => {
        return new DrawSquare();    
    },
};

/**
 * Holds an instance for  each DrawProcessor defined in DRAWPROCESSORS.
 */
class DrawProcessorFactory {

    /**
     * Creates an instance of each DrawProcessor defined in DRAWPROCESSORS
     */
    constructor() {
        this.processor = null;
        this.processorNames = Object.getOwnPropertyNames(DRAWPROCESSORS);
        this.processors = [];

        this.processorNames.forEach( 
            (value, index, array) => {
                this.processors[value] = DRAWPROCESSORS[value]();
                // console.log("Factory.constructor processors[" + value + "]= " + this.processors[value].constructor.name );
            }
        );

        this.select(DRAWPROCESSORS.Scribble);
    }

    /**
     * Select the processor returned by get
     * @param {() => DrawProcessor} processor to return with get, select the processor by using DRAWPROCESSORS.name or DRAWPROCESSORS[name], e.g. DRAWPROCESSORS.Scribble or DRAWPROCESSORS['Scribble']
     */
    select(processor) {
        // console.log("DrawProcessorFactory.select: " + processor.name);
        this.processor = this.processors[processor.name];
    }

    /**
     * @returns {DrawProcessor} the selected draw processor, e.g. an instance of DrawScribble
     */
    get() {
        // console.log("DrawProcessorFactory.get: " + this.processor.constructor.name);
        return this.processor;
    }

    getProcessorNames() {
        return Object.getOwnPropertyNames(DRAWPROCESSORS);
    }
}

/**
 * The singleton drawProcessorFactory
 */
export const drawProcessorFactory = new DrawProcessorFactory();