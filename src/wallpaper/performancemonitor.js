'use strict';
import { CreateAppend } from './utils/utils';

/**
 * Shows CPU warning
 */
class PerformanceMonitor {
    constructor() {
        // variables regarding use fps settings & frameskipping
        this.systemfps = 30; // wallpaper engine will supply us with the target framerate and we will use a sloppy frameskipping mechanism to adjust to that.
        this.targetFramerateUser = 0; // used to override wallpaper engines settings with wallpaper settings .. when value is 0 systemfps is used
        this.nextRenderTimestamp = 0; // used from frameskipping to determine if current time is before or after we should render the next frame (see render function)
        
        // variable regarding fps
        this.fpsElement = document.createElement('div');
        this.fpsElement.id = 'fps';
        document.body.appendChild(this.fpsElement);
        this.fpsElement.style.display = 'block';

        this.fpsPrevUpdate = 0;
        this.fpsFrameCount = 0;
        this.fpsRenderTime = 0;

        this.cpuWarningVisible = false;
        this.cpuWarningElement = CreateAppend('div', document.body, 'cpu-warning');
        this.cpuWarningHeader = CreateAppend('h2', this.cpuWarningElement);
        this.cpuWarningHeader.innerHTML = 'CPU Usage Warning!';
        const p = CreateAppend( 'p', this.cpuWarningElement);
        p.appendChild( document.createTextNode('The CPU usage of this wallpaper is high at the moment. Lower some settings.') );
        CreateAppend('br', p);
        p.appendChild( document.createTextNode('This might be caused by:') );
        const small = CreateAppend('small', p);
        small.appendChild(document.createTextNode('Render method that is set to fill with large objects.'));
        CreateAppend('br', small);
        small.appendChild(document.createTextNode('High detail level'));
        CreateAppend('br', small);
        small.appendChild(document.createTextNode('Possibly glow effect'));
        CreateAppend('br', p);
        CreateAppend('br', p);
        p.appendChild( document.createTextNode('Estimated CPU usage: ') );
        this.cpuWarningLabel = CreateAppend( 'span', p, 'usage-label');
        
        this._cpuCores = 4;
        this._cpuWarningAt = 10;
        
    }

    /**
     * @returns {number}
     */
    get cpuCores() {
        return this._cpuCores; 
    }
    set cpuCores(cores) {
        this._cpuCores = cores; 
    }

    /**
     * @returns {number}
     */
    get cpuWarningAt() {
        return this._cpuWarningAt; 
    }
    set cpuWarningAt(level) {
        this._cpuWarningAt = level; 
    }

    /**
     * measures framerate & updates framerate label
     **/
    updateFps( timestamp ) { 
        if ( timestamp > this.fpsPrevUpdate + 1000 ) {
            const diff = ( timestamp - this.fpsPrevUpdate ) / 1000; // time diff in seconds
            const fps = this.fpsFrameCount / diff; // adjust framerate to exactly 1 second 
            
            
            let cpuUsage = this.fpsRenderTime/10/this._cpuCores + 2;
            cpuUsage *= 1.3;
            if ( cpuUsage > 99 ) cpuUsage = 99;
            
            if ( this._cpuWarningAt < cpuUsage && !this.cpuWarningVisible ) {
                this.cpuWarningVisible = true;
                this.cpuWarningElement.style.display = 'block';
                this.cpuWarningLabel.innerText = ( cpuUsage ).toFixed(0) + '%'; // + this._cpuWarningAt;
            } else if ( this._cpuWarningAt > cpuUsage && this.cpuWarningVisible ) {
                this.cpuWarningVisible = false;
                this.cpuWarningElement.style.display = 'none';
            } else if ( this.cpuWarningVisible ) {
                this.cpuWarningLabel.innerText = ( cpuUsage ).toFixed(0) + '%'; // + this._cpuWarningAt + this.cpuWarningVisible;
            }
            this.fpsFrameCount = 0;
            this.fpsPrevUpdate = timestamp;
            this.fpsRenderTime = 0;
        }
        this.fpsFrameCount++;
    }

    /**
     * processing anything regarding frameskipping
     *
     * @returns true when should skip
     **/
    shouldSkipFrame( timestamp ) {
        // should we skip this frame?
        
        if ( timestamp < this.nextRenderTimestamp ) {
            return true;
        }
        
        // update time for next frame to render
        const frameInterval = this.targetFramerateUser > 0 
            ? 1000 / this.targetFramerateUser
            : 1000 / this.systemfps;		
        this.nextRenderTimestamp = Math.floor( timestamp / frameInterval ) * frameInterval + frameInterval;
        return false;
        
    }

}

export const performanceMonitor = new PerformanceMonitor();
