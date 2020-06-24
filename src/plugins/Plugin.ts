import { autorun, getDependencyTree, IDependencyTree, IReactionDisposer, Lambda, observe } from 'mobx';
import { Plugin as PluginSetup } from '../Setup/Application/Plugin';
import { Screen } from '../Setup/Application/Screen';
import controller from '../Setup/Controller/Factory';
import { SetupBase } from '../Setup/SetupBase';
import { callerAndfName } from '../utils/debugging';
import { CanvasRegistration, HtmlRegistration, PlainRegistration, Plugin as PluginInterface, Registration, RenderPlugin } from './PluginInterface';


/**
 * Wrapper for plugin instance.
 */
export class Plugin {

    private plugin?: PluginInterface;

    private render?: (screen: Screen, gradient?: CanvasGradient | string) => void;

    private element?: HTMLElement;
    private div?: HTMLDivElement;
    private canvas?: HTMLCanvasElement;
    private renderingContext?: CanvasRenderingContext2D;
    private screen?: Screen;

    private interval?: NodeJS.Timeout;

    createElement = (): void => {
        if ((this.registration as CanvasRegistration).canvasFactory) {
            // console.log(`${this.constructor.name}[${this.setup.className}][${this.setup.id}].createElement canvasFactory`);
            this.element = this.canvas = window.document.createElement('canvas');
            const context = this.canvas.getContext('2d');
            if (context == null) {
                console.error(`${callerAndfName()}[${this.setup.className}][${this.setup.id}] canvasFactory renderingContext == null`);
            } else {
                this.renderingContext = context;
            }
        }
        if ((this.registration as HtmlRegistration).htmlFactory) {
            // console.log(`${this.constructor.name}[${this.setup.className}][${this.setup.id}].createElement htmlFactory`);
            this.element = this.div = window.document.createElement('div');
        }
        if (this.element) {
            // console.log(`${this.constructor.name}[${this.setup.className}][${this.setup.id}].createElement init ${this.element}`);
            this.element.id = this.setup.id;
            this.element.style.position = 'fixed';
            this.element.style.border = '1px solid orange';
            window.document.body.appendChild(this.element);

            this.renderAutorunDisposers.push(autorun(this.setBounds));
        }
    }

    createPlugin = (): void => {
        const { canvasFactory } = (this.registration as CanvasRegistration);
        const { htmlFactory } = (this.registration as HtmlRegistration);
        const { factory } = (this.registration as PlainRegistration);

        if (this.canvas) {
            console.log(`${this.constructor.name}[${this.setup.className}][${this.setup.id}].createPlugin canvasFactory`);
            this.plugin = new canvasFactory(this.setup, this.canvas);
        }
        if (this.div) {
            console.log(`${this.constructor.name}[${this.setup.className}][${this.setup.id}].createPlugin htmlFactory`);
            this.plugin = new htmlFactory(this.setup, this.div);
        }
        if (factory) {
            console.log(`${this.constructor.name}[${this.setup.className}][${this.setup.id}].createPlugin factory`);
            this.plugin = new factory(this.setup);
        }
        const render = this.render = (this.plugin as RenderPlugin).render;

        if (render) {
            console.log(`${this.constructor.name}[${this.setup.className}][${this.setup.id}].createPlugin set this.render`);

            // if ((this.plugin as IntervalPlugin).renderInterval) {
            //     console.log(
            //         `${this.constructor.name}[${this.setup.className}][${this.setup.id}].createPlugin set render Interval=${(this.plugin as IntervalPlugin).renderInterval}`);

            //     this.interval = setInterval(
            //         () => render('green'),
            //         (this.plugin as IntervalPlugin).renderInterval
            //     );
            // }

            controller.getSetup(Screen.name, 0)
                .then(setup => {
                    this.screen = setup as Screen;
                    this.startRender();
                });
        }
    }

    private observers = new Array<Lambda>();


    startObserver = (observableInfo: IDependencyTree): void => {
        let matches = /^(.+@[0-9]+)(\.)(.*)$/.exec(observableInfo.name);
        let objectId;
        let objectProperty;
        let object;

        if (matches?.length == 4) {
            objectId = matches?.[1];
            objectProperty = matches?.[3];
            if (!objectId) throw new Error(`Plugin[${this.setup.id}] dependency=${observableInfo.name} can't get objectId`);
            if (!objectProperty) throw new Error(`Plugin[${this.setup.id}] dependency=${observableInfo.name} can't get objectProperty`);

            object = SetupBase.mobxInstances[objectId];
            this.observers.push(
                observe(object, objectProperty as any, this.renderer)
            );
        } else {
            matches = /^(.+)(\.)(.+)$/.exec(observableInfo.name);

            objectId = matches?.[1];
            objectProperty = matches?.[3];
            if (!objectId) throw new Error(`Plugin[${this.setup.id}] dependency=${observableInfo.name} can't get objectId`);
            if (!objectProperty) throw new Error(`Plugin[${this.setup.id}] dependency=${observableInfo.name} can't get objectProperty`);

            object = SetupBase.instances[objectId];
            this.observers.push(
                observe(object[objectProperty], this.renderer)
            );
        }
        observableInfo.dependencies?.forEach(
            this.startObserver
        );

        console.log(`${callerAndfName()}[${this.setup.id}] dependency=${observableInfo.name} [${objectId}].${objectProperty}`);
    };

    startRender = (): void => {
        const disposer = autorun(this.renderer);
        const toBeObserved = getDependencyTree(disposer);

        disposer();

        toBeObserved.dependencies?.forEach(
            this.startObserver
        );
    };

    lastFps = 0;
    start?: number;
    frames = 0;
    skippedFrames = 0;
    continuesSkipped = 0;
    requestedAnimationFrame?: number;

    /**
     * If not rendering requestAnimaitonFrame for renderNow.
     * If this.start is undefined, the requestAnimationFrame is skipped, to be able to detect dependcies of render
     */
    private renderer = (/*r: IReactionPublic*/): void => {
        if (this.screen == undefined) throw new Error(`${callerAndfName()}: this.screen is undefined`);
        if (this.lastFps != this.screen.fps) {
            this.lastFps = this.screen.fps;
            this.frames = 0;
            this.skippedFrames = 0;
            this.continuesSkipped = 0;
            this.start = undefined;
        }

        if (this.rendering === true) {
            this.skippedFrames += 1;
            this.continuesSkipped += 1;
            // Wait for next frame
        } else {
            if ((this.continuesSkipped > 1) && ((this.frames + this.skippedFrames) > (3 * this.screen.fps)) && (this.screen.fps > this.continuesSkipped)) {
                console.warn(
                    `${callerAndfName()}: continuesSkipped=${this.continuesSkipped} =>` +
                    ` screen.fps=${this.screen.fps}-=${this.continuesSkipped - 1} ${this.frames}+${this.skippedFrames}`);
                this.screen.fps -= (this.continuesSkipped - 1);
            }
            this.continuesSkipped = 0;
            this.rendering = true;

            if (this.start === undefined) {
                this.renderNow(performance.now());
            } else {
                this.requestedAnimationFrame = requestAnimationFrame(
                    this.renderNow
                );
            }
        }
    }

    private rendering = false;

    private renderNow = (time: number): void => {
        //console.debug(`renderNow this=${this} start=${this.start} screen=${this.screen} render=${typeof this.render}`);

        this.start = this.start ?? time;
        if (this.screen == undefined) throw new Error(`${callerAndfName()}: this.screen is undefined`);
        if (this.render == undefined) throw new Error(`${callerAndfName()}: this.render is undefined`);

        const dbgFrames = 2 * this.screen.fps;
        this.frames += 1;

        if (this.canvas) {
            this.render(
                this.screen,
                this.createGradient(this.screen)
            );
        } else if (this.div) {
            if (this.screen?.activeGradient?.colors[0] === undefined) {
                this.render(this.screen);
            } else {
                this.render(this.screen, this.screen.activeGradient.colors[0]);
            }
        }

        (this.frames % dbgFrames == 1)
            && ((this.frames / ((time - this.start) / 1000)) < (0.9 * this.screen.fps))
            && console.info(
                `${callerAndfName()}[${this.setup.className}][${this.setup.id}]:` +
                ` fps=${(this.frames / ((time - this.start) / 1000)).toFixed(2)} skipped=${(this.skippedFrames / ((time - this.start) / 1000)).toFixed(2)}`);

        this.rendering = false;
    }

    private createGradient = (screen: Screen): CanvasGradient | string => {
        const { activeGradient } = screen;

        if (!activeGradient) {
            console.error(`${callerAndfName()}[${this.setup.className}][${this.setup.id}] no activeGradient`);
            return '';
        }
        if (!this.renderingContext) {
            console.error(`${callerAndfName()}[${this.setup.className}][${this.setup.id}] no renderingContext`);
            return '';
        }
        if (!this.setup.scaledBounds) {
            console.error(`${callerAndfName()}[${this.setup.className}][${this.setup.id}] no scaledBounds`);
            return '';
        }
        const { type, colors } = activeGradient;
        const { scaledBounds } = this.setup;

        let gradient: CanvasGradient | string;

        switch (type) {
            case 'Solid':
                gradient = colors[0];
                break;
            case 'Circular':
                gradient = this.renderingContext.createRadialGradient(
                    scaledBounds.width / 2,
                    scaledBounds.height / 2,
                    0,
                    scaledBounds.width / 2,
                    scaledBounds.height / 2,
                    (scaledBounds.width + scaledBounds.height) / 4);

                for (let i = 0; i < colors.length; i += 1) {
                    gradient.addColorStop(i / (colors.length - 1), colors[i]);
                }
                break;
            case 'Horizontal':
                gradient = this.renderingContext.createLinearGradient(0, scaledBounds.height / 2, scaledBounds.width, scaledBounds.height / 2);
                for (let i = 0; i < colors.length; i += 1) {
                    gradient.addColorStop(i / (colors.length - 1), colors[i]);
                }
                break;
            case 'Vertical':
                gradient = this.renderingContext.createLinearGradient(scaledBounds.width / 2, 0, scaledBounds.width / 2, scaledBounds.height);
                for (let i = 0; i < colors.length; i += 1) {
                    gradient.addColorStop(i / (colors.length - 1), colors[i]);
                }
                break;
        }
        // console.log(`${callerAndfName()}[${this.setup.className}][${this.setup.id}] `, {type, colors, scaledBounds, gradient});
        return gradient;
    };

    private renderAutorunDisposers: IReactionDisposer[] = [];

    constructor(protected setup: PluginSetup, protected registration: Registration) {
        this.createElement();
        this.createPlugin();
    }

    setBounds = (): void => {
        if (this.element) {
            const scaledBounds = this.setup.scaledBounds;

            if (!scaledBounds)
                throw new Error(`${this.constructor.name}[${this.setup.className}][${this.setup.id}].setBounds() no scaledBounds`);

            console.log(
                `${this.constructor.name}[${this.setup.className}][${this.setup.id}].setBounds` +
                `(${scaledBounds.id}, ${[scaledBounds.x, scaledBounds.y, scaledBounds.width, scaledBounds.height]}) element=${this.element}`);

            this.element.style.left = scaledBounds.x + 'px';
            this.element.style.top = scaledBounds.y + 'px';
            this.element.style.width = scaledBounds.width + 'px';
            this.element.style.height = scaledBounds.height + 'px';

            if (this.canvas) {
                this.canvas.width = scaledBounds.width;
                this.canvas.height = scaledBounds.height;
            }
        }
    }

    close = (): void => {
        this.requestedAnimationFrame &&
            cancelAnimationFrame(this.requestedAnimationFrame);
        this.requestedAnimationFrame = undefined;

        this.renderAutorunDisposers.forEach(
            disposer => disposer()
        );
        this.renderAutorunDisposers.length = 0;

        this.observers.forEach(
            disposer => disposer()
        );
        this.observers.length = 0;

        this.interval &&
            clearInterval(this.interval);
        this.interval = undefined;

        this.element &&
            window.document.body.removeChild(this.element);

        this.canvas = this.renderingContext = this.element = undefined;
    }
}
