import { Plugin as PluginSetup } from '../Setup/Application/Plugin';
import { Plugin as PluginInterface, Registration, CanvasRegistration, HtmlRegistration, PlainRegistration, RenderPlugin, IntervalPlugin } from './PluginInterface';
import { autorun, IReactionDisposer } from 'mobx';
import controller from '../Setup/Controller/Factory';
import { Screen } from '../Setup/Application/Screen';
import { callerAndfName } from '../utils/debugging';


/**
 * Wrapper for plugin instance.
 */
export class Plugin {

    private plugin?: PluginInterface;

    private render?: (gradient: any) => void;

    private element?: HTMLElement;
    private div?: HTMLDivElement;
    private canvas?: HTMLCanvasElement;
    private renderingContext?: CanvasRenderingContext2D;

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

            autorun(this.setBounds);
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
            const start = performance.now();
            let frames = 0;
            controller.getSetup(Screen.name, 0)
                .then(setup => {
                    this.renderAutorunDisposer = autorun(
                        (/*r: IReactionPublic*/) => {
                            const span = performance.now() - start;
                            frames += 1;
                            const fps = frames / (span / 1000);
                            if (frames % 1000 == 0) console.info(`${callerAndfName()}[${this.setup.className}][${this.setup.id}]: fps=${fps}`);

                            const gradient = this.createGradient(setup as Screen);

                            render(gradient);
                        });
                }
                );
        }
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
        return gradient;
    };

    private renderAutorunDisposer: IReactionDisposer | undefined;

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
        this.renderAutorunDisposer &&
            this.renderAutorunDisposer();

        this.interval &&
            clearInterval(this.interval);

        this.element &&
            window.document.body.removeChild(this.element);
    }
}
