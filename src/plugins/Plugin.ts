import { Plugin as PluginSetup } from '../Setup/Application/Plugin';
import { Plugin as PluginInterface, Registration, CanvasRegistration, HtmlRegistration, PlainRegistration, RenderPlugin, IntervalPlugin } from './PluginInterface';
import { autorun, IReactionDisposer } from 'mobx';


/**
 * Wrapper for plugin instance.
 */
export class Plugin {

    private plugin?: PluginInterface;

    private render?: (gradient: any) => void;

    private element?: HTMLElement;
    private div?: HTMLDivElement;
    private canvas?: HTMLCanvasElement;

    private interval?: NodeJS.Timeout;

    createElement = (): void => {
        if ((this.registration as CanvasRegistration).canvasFactory) {
            console.log(`${this.constructor.name}[${this.setup.className}][${this.setup.id}].createElement canvasFactory`);
            this.element = this.canvas = window.document.createElement('canvas');
        }
        if ((this.registration as HtmlRegistration).htmlFactory) {
            console.log(`${this.constructor.name}[${this.setup.className}][${this.setup.id}].createElement htmlFactory`);
            this.element = this.div = window.document.createElement('div');
        }
        if (this.element) {
            console.log(`${this.constructor.name}[${this.setup.className}][${this.setup.id}].createElement init ${this.element}`);
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

            if ((this.plugin as IntervalPlugin).renderInterval) {
                console.log(
                    `${this.constructor.name}[${this.setup.className}][${this.setup.id}].createPlugin set render Interval=${(this.plugin as IntervalPlugin).renderInterval}`);
                
                this.interval = setInterval(
                    () => render('green'),
                    (this.plugin as IntervalPlugin).renderInterval
                );
            }
            this.renderAutorunDisposer = autorun(
                (/*r: IReactionPublic*/) => render('lightgreen')
            );
        }
    }

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
