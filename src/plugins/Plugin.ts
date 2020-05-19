import { Plugin as PluginSetup } from '../Setup/Application/Plugin';
import { PluginConstructor, PluginInterface } from './PluginInterface';
import { autorun } from 'mobx';


/**
 * Wrapper for plugin instance.
 */
export class Plugin {

    private plugin: PluginInterface;

    private canvas: HTMLCanvasElement;
    private interval: NodeJS.Timeout;

    constructor(protected setup: PluginSetup, factory: PluginConstructor<PluginInterface>) {

        this.canvas = window.document.createElement('canvas');
        this.canvas.id = setup.id;


        this.canvas.style.position = 'fixed';
        this.canvas.style.border = '1px solid orange';
        
        autorun(this.setBounds);

        window.document.body.appendChild(this.canvas);

        this.plugin = new factory(setup, this.canvas);

        this.interval = setInterval(
            () => this.plugin.render('green'),
            1000
        );
    }

    setBounds = (): void => {
        const scaledBounds = this.setup.scaledBounds;

        if (! scaledBounds)
            throw new Error(`${this.constructor.name}[${this.setup.className}][${this.setup.id}].setBounds() no scaledBounds`);
        
        this.canvas.style.left = scaledBounds.x + 'px';
        this.canvas.style.top = scaledBounds.y + 'px';
        this.canvas.style.width = scaledBounds.width + 'px';
        this.canvas.style.height = scaledBounds.height + 'px';
    }

    close = (): void => {
        clearInterval(this.interval);

        window.document.body.removeChild(this.canvas);
    }
}
