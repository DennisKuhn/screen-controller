import {app, Display, Rectangle, screen} from 'electron';
import {EventEmitter} from 'events';
import {cloneDeep, debounce, isEqual} from 'lodash';

export interface DisplayBounds extends Rectangle {
    displayId: number;
}

export class ScreenBounds extends EventEmitter {
    private _left = 0;
    private _top = 0;
    private _right = 0;
    private _bottom = 0;
    private _displays: Display[] = [];
    private _bounds: DisplayBounds[] = [];

    constructor() {
        super();
        app.on('ready', () => {
            this.recalculateBounds();
            screen.on('display-metrics-changed', debounce(this.onDisplayMetricsChanged, 2000));
            this.emit('ready');
        });
    }

    private onDisplayMetricsChanged = (event: Event, display: Display, changedMetrics: string[]): void => {
        const original = cloneDeep(this.bounds);
        const current = JSON.stringify(this.recalculateBounds());
        if (!isEqual(original, current)) {
            this.emit('bounds-changed', event, display, changedMetrics);
        }
    }

    private recalculateBounds(): DisplayBounds[] {
        this._left = 0;
        this._right = 0;
        this._top = 0;
        this._bottom = 0;
        const workAreas = screen.getAllDisplays().map((display) => {
            const dipWorkArea = screen.dipToScreenRect(null, display.workArea);
            if (this._left > dipWorkArea.x) {
                this._left = dipWorkArea.x;
            }
            if (this._right < dipWorkArea.x + dipWorkArea.width) {
                this._right = dipWorkArea.x + dipWorkArea.width;
            }
            if (this._top > dipWorkArea.y) {
                this._top = dipWorkArea.y;
            }
            if (this._bottom < dipWorkArea.y + dipWorkArea.height) {
                this._bottom = dipWorkArea.y + dipWorkArea.height;
            }
            return {
                dipWorkArea,
                display
            };
        });
        this._bounds = workAreas.map(({display, dipWorkArea}) => {
            return {
                displayId: display.id,
                x: dipWorkArea.x - this._left,
                y: dipWorkArea.y - this._top,
                width: dipWorkArea.width,
                height: dipWorkArea.height
            };
        });
        return this._bounds;
    }

    get left(): number {
        return this._left;
    }

    get top(): number {
        return this._top;
    }

    get right(): number {
        return this._right;
    }

    get bottom(): number {
        return this._bottom;
    }

    get displays(): Electron.Display[] {
        return this._displays;
    }

    get bounds(): DisplayBounds[] {
        return this._bounds;
    }

    get width(): number {
        return this._right - this._left;
    }

    get height(): number {
        return this._bottom - this._top;
    }

    findBoundsByDisplayId(displayId: number): DisplayBounds | undefined {
        return this._bounds.find((b) => {
            return b.displayId === displayId;
        });
    }

    on(event: 'bounds-changed', listener: (event: Event, display: Display, changedMetrics: string[]) => void): this {
        return super.on(event, listener);
    }

    once(event: 'bounds-changed', listener: (event: Event, display: Display, changedMetrics: string[]) => void): this {
        return super.once(event, listener);
    }

    addListener(event: 'bounds-changed', listener: (event: Event, display: Display, changedMetrics: string[]) => void): this {
        return super.addListener(event, listener);
    }

    removeListener(event: 'bounds-changed', listener: (event: Event, display: Display, changedMetrics: string[]) => void): this {
        return super.removeListener(event, listener);
    }
}

export default new ScreenBounds();
