import { Plugin as PluginSetup } from '../Setup/Application/Plugin';
import { PluginConstructor, PluginInterface } from './PluginInterface';


/**
 * Wrapper for plugin instance.
 */
export class Plugin {

    private plugin: PluginInterface;

    private canvas: HTMLCanvasElement;

    constructor(setup: PluginSetup, factory: PluginConstructor<PluginInterface>) {

        this.canvas = window.document.createElement('canvas');

        if (!setup.scaledBounds)
            throw new Error(`${this.constructor.name}[${setup.className}][${setup.id}] no scaledBounds`);

        this.canvas.style.left = setup.scaledBounds.x + 'px';
        this.canvas.style.top = setup.scaledBounds.y + 'px';
        this.canvas.style.width = setup.scaledBounds.width + 'px';
        this.canvas.style.height = setup.scaledBounds.height + 'px';
        
        this.plugin = new factory(setup, this.canvas);
    }
}