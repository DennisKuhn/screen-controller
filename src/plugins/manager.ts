import { Plugin as Setup } from '../Setup/Application/Plugin';
import { Registration, PluginInterface, PluginConstructor } from './PluginInterface';
import requireGlob from 'require-glob';
import { Browser } from '../Setup/Application/Browser';
import { IMapDidChange, autorun } from 'mobx';
import { Plugin } from './Plugin';
import { SimpleRectangle } from '../Setup/Default/RectangleInterface';
import { isEqual } from 'lodash';
import { Rectangle } from '../Setup/Default/Rectangle';

const pluginDir = 'D:\\Dennis\\Projects\\wallpaper-plugins\\dist\\';

type PluginReg = Registration<PluginInterface>;
type InnerPlugin = { default: PluginReg };
type PluginModule = InnerPlugin | PluginReg;
type PluginImports = { [key: string]: PluginModule };
type FlatImports = { [key: string]: PluginReg };


export class Manager {

    static readonly registrations = new Map<string, PluginReg>();

    static async loadAll(): Promise<void> {
        // console.log(`${this.constructor.name}.loadAll() current=${Manager.registrations.size}`);

        await Manager.loadPlugins('*');
    }

    /**
     * 
     * @param prefix use '*' to load all, otherwise the className 
     */
    static async loadPlugins(prefix: string): Promise<void> {
        // console.log(`${this.constructor.name}.loadPlugins(${prefix}) current=${Manager.registrations.size}`);

        const mixed: PluginImports = await requireGlob([prefix + '.js'], { cwd: pluginDir });
        const flat: FlatImports = {};

        for (const [id, mix] of Object.entries(mixed)) {
            flat[id] = (mix as InnerPlugin).default ?? mix as PluginReg;
        }

        for (const [id, registration] of Object.entries(flat)) {

            if (!Manager.registrations.has(id)) {
                if (registration.schema) {
                    // console.log(`${this.constructor.name}.loadPlugins(${prefix}) add ${id}`);
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
        // console.log(`${this.constructor.name}[${this.browser.id}].load(${className}) current=${Manager.registrations.size}`);

        let registration = Manager.registrations.get(className);

        if (!registration)
            await Manager.loadPlugins(className);

        registration = Manager.registrations.get(className);

        if (!registration)
            throw new Error(`${this.constructor.name}.load(${className}) failed`);

        return registration.plugin;
    }

    constructor(private browser: Browser) {
        this.loadPlugins().then(() => {
            // console.log(`${this.constructor.name}[${browser.id}] loaded Plugins()`);
            browser.plugins.observe(
                this.onPluginsChanged
            );
        });
    }

    async loadPlugins(): Promise<void> {
        for (const plugin of this.browser.plugins.values()) {
            if (plugin)
                await this.addPlugin(plugin);
            else
                console.error(`${this.constructor.name}[${this.browser.id}].loadPlugins() a plugin is null`);
        }
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

                    // console.log(`${this.constructor.name}[${this.browser.id}] close ${changes.oldValue.id}`);

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

        if (!setup.scaledBounds) {
            // console.log(
            //     `${this.constructor.name}[${this.browser.id}].updateBounds(${setup.id}) set scaled=${[scaled.x, scaled.y, scaled.width, scaled.height]}`);

            setup.scaledBounds = Rectangle.createNew(setup.id, scaled);
        } else if (!isEqual(setup.scaledBounds.toSimple(), scaled)) {
            if ((setup.scaledBounds.x != scaled.x) && (setup.scaledBounds.y != scaled.y)
                && (setup.scaledBounds.height != scaled.height) && (setup.scaledBounds.width != scaled.width)) {
                // console.log(
                //     `${this.constructor.name}[${this.browser.id}].updateBounds(${setup.id}) new scaled=${[scaled.x, scaled.y, scaled.width, scaled.height]}`);

                setup.scaledBounds = Rectangle.createNew(setup.id, scaled);
            } else {
                for (const [key, value] of Object.entries(scaled)) {
                    if (setup.scaledBounds[key] != value) {
                        // console.log(
                        //     `${this.constructor.name}[${this.browser.id}].updateBounds(${setup.id}) ${key}==${setup.scaledBounds[key]} = ${value}`);
                        setup.scaledBounds[key] = value;
                    }
                }
            }
        } else {
            // console.log(
            //     `${this.constructor.name}[${this.browser.id}].updateBounds(${setup.id}) keep scaled=${[scaled.x, scaled.y, scaled.width, scaled.height]}`, setup.scaledBounds);
        }
    }

    private addPlugin = async (setup: Setup): Promise<void> => {
        // console.log(`${this.constructor.name}[${this.browser.id}].addPlugin(${setup.id}) current=${Manager.registrations.size}`);

        autorun(
            () => this.updateBounds(setup)
        );

        try {
            this.plugins.set(
                setup.id,
                new Plugin(
                    setup,
                    await this.load(setup.className)
                )
            );
        } catch (error) {
            console.error(`${this.constructor.name}[${this.browser.id}].addPlugin(${setup.id}) failed: ${error}`, error );
        }
    }
}