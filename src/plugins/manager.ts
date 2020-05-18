import { Plugin as Setup } from '../Setup/Application/Plugin';
import { Registration, PluginInterface, PluginConstructor } from './PluginInterface';
import requireGlob from 'require-glob';
import { Browser } from '../Setup/Application/Browser';
import { IMapDidChange, reaction } from 'mobx';
import { Plugin } from './Plugin';
import { SimpleRectangle } from '../Setup/Default/RectangleInterface';
import { isEqual } from 'lodash';
import { Rectangle } from '../Setup/Default/Rectangle';

const pluginDir = 'D:\\Dennis\\Projects\\plugins\\dist\\';

type PluginReg = Registration<PluginInterface>;
type InnerPlugin = { default: PluginReg };
type PluginModule = InnerPlugin | PluginReg;
type PluginImports = { [key: string]: PluginModule };
type FlatImports = { [key: string]: PluginReg };


export class Manager {

    static readonly registrations = new Map<string, PluginReg>();

    static async loadAll(): Promise<void> {
        // console.log(`${this.constructor.name}.loadAll() current=${Object.keys(Manager.registrations).length}`);

        await Manager.loadPlugins('*');
    }

    /**
     * 
     * @param prefix use '*' to load all, otherwise the className 
     */
    static async loadPlugins(prefix: string): Promise<void> {
        console.log(`${this.constructor.name}.loadPlugins(${prefix}) current=${Object.keys(Manager.registrations).length}`);

        const mixed: PluginImports = await requireGlob([prefix + '.js'], { cwd: pluginDir });
        const flat: FlatImports = {};

        for (const [id, mix] of Object.entries(mixed)) {
            flat[id] = (mix as InnerPlugin).default ?? mix as PluginReg;
        }

        for (const [id, registration] of Object.entries(flat)) {

            if (!(id in Manager.registrations)) {
                console.log(`${this.constructor.name}.loadAll() add ${id}`);

                if (registration.schema) {
                    try {
                        Setup.add(registration.schema);
                        Manager.registrations.set(id, registration);
                    } catch (error) {
                        console.error(`Manager.loadPlugins(${prefix})): add ${id}.schema caused: ${error}`, registration, error);
                    }
                } else {
                    console.error(`Manager.loadPlugins(${prefix}): ${id} has no schema`, registration);
                }
            } else {
                console.warn(`Manager.loadPlugins(${prefix}): ${id} already registered`);
            }
        }
    }

    async load(className: string): Promise<PluginConstructor<PluginInterface>> {
        console.log(`${this.constructor.name}[${this.browser.id}].load(${className}) current=${Object.keys(Manager.registrations).length}`);

        let registration = Manager.registrations.get(className);

        if (!registration)
            await Manager.loadPlugins(className);

        registration = Manager.registrations.get(className);

        if (!registration)
            throw new Error(`${this.constructor.name}.load(${className}) failed`);

        return registration.plugin;
    }

    constructor(private browser: Browser) {
        for (const plugin of browser.plugins.values()) {
            if (plugin)
                this.addPlugin(plugin);
            else
                console.error(`${this.constructor.name}[${browser.id}] a plugin is null`);
        }
        browser.plugins.observe(
            this.onPluginsChanged
        );
    }

    plugins = new Map<string, Plugin>();

    private onPluginsChanged = (changes: IMapDidChange<string, Setup | null>): void => {
        switch (changes.type) {
            case 'add':
                if (changes.newValue == null) {
                    console.log(`${this.constructor.name}[${this.browser.id}].onPluginsChanged(${changes.type}, ${changes.name}}) = null`);
                } else {
                    this.addPlugin(changes.newValue);
                }
                break;
            case 'update':
                if (changes.oldValue != null) {
                    throw new Error(
                        `${this.constructor.name}[${this.browser.id}].onPluginsChanged(${changes.type}, ${changes.name}) from ${changes.oldValue.id} to ${changes.newValue?.id}`);
                } else if (changes.newValue == null) {
                    throw new Error(`${this.constructor.name}[${this.browser.id}].onPluginsChanged(${changes.type}, ${changes.name}) from null to null`);
                } else {
                    this.addPlugin(changes.newValue);
                }
                break;
            case 'delete':
                if (!changes.oldValue)
                    throw new Error(`${this.constructor.name}[${this.browser.id}].onPluginsChanged(${changes.type}, ${changes.name}}) no oldValue`);
                else {
                    const plugin = this.plugins.get(changes.oldValue.id);

                    if (!plugin)
                        throw new Error(`${this.constructor.name}[${this.browser.id}].onPluginsChanged(${changes.type}, ${changes.oldValue.id}}) no plugin`);

                    console.log(`${this.constructor.name}[${this.browser.id}] close ${changes.oldValue.id}`);

                    plugin.close();

                    this.plugins.delete(changes.oldValue.id);
                }
                break;
        }
    }

    private updateBounds(setup: Setup): void {
        if (!this.browser.scaled)
            throw new Error(`${this.constructor.name}[${this.browser.id}].addPlugin(${setup.id}) browser has no scaled bounds`);
        
        const scaled: SimpleRectangle = {
            x: this.browser.scaled.width * setup.relativeBounds.x,
            y: this.browser.scaled.height * setup.relativeBounds.y,
            width: this.browser.scaled.width * setup.relativeBounds.width,
            height: this.browser.scaled.height * setup.relativeBounds.height,
        };

        if ((!setup.scaledBounds) || (!isEqual(setup.scaledBounds.simple, scaled))) {
            console.log(
                `${this.constructor.name}[${this.browser.id}].addPlugin(${setup.id}) new scaled=${[scaled.x, scaled.y, scaled.width, scaled.height]}`, setup.scaledBounds);

            setup.scaledBounds = Rectangle.createNew(setup.id, scaled);
        } else {
            console.log(
                `${this.constructor.name}[${this.browser.id}].addPlugin(${setup.id}) keep scaled=${[scaled.x, scaled.y, scaled.width, scaled.height]}`, setup.scaledBounds);
        }
    }

    private addPlugin = async (setup: Setup): Promise<void> => {
        console.log(`${this.constructor.name}[${this.browser.id}].addPlugin(${setup.id}) current=${Object.keys(Manager.registrations).length}`);

        this.updateBounds(setup);

        try {
            this.plugins.set(
                setup.id,
                new Plugin(
                    setup,
                    await this.load(setup.className)
                )
            );
        } catch (error) {
            console.log(`${this.constructor.name}[${this.browser.id}].addPlugin(${setup.id}) failed: ${error}`, error );
        }
    }
}