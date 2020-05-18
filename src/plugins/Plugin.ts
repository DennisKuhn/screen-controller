import { Plugin as PluginSetup } from '../Setup/Application/Plugin';
import { PluginConstructor, PluginInterface } from './PluginInterface';


/**
 * Wrapper for plugin instance.
 */
export class Plugin {

    private plugin: PluginInterface;

    private canvas: HTMLCanvasElement;
    private interval: NodeJS.Timeout;

    constructor(setup: PluginSetup, factory: PluginConstructor<PluginInterface>) {

        this.canvas = window.document.createElement('canvas');
        this.canvas.id = setup.id;

        if (!setup.scaledBounds)
            throw new Error(`${this.constructor.name}[${setup.className}][${setup.id}] no scaledBounds`);

        this.canvas.style.position = 'fixed';
        this.canvas.style.left = setup.scaledBounds.x + 'px';
        this.canvas.style.top = setup.scaledBounds.y + 'px';
        this.canvas.style.width = setup.scaledBounds.width + 'px';
        this.canvas.style.height = setup.scaledBounds.height + 'px';
        this.canvas.style.border = '1px solid orange';
        
        window.document.body.appendChild(this.canvas);

        this.plugin = new factory(setup, this.canvas);

        this.interval = setInterval(
            () => this.plugin.render('green'),
            1000
        );
    }

    close = (): void => {
        clearInterval(this.interval);

        window.document.body.removeChild(this.canvas);
    }
}
