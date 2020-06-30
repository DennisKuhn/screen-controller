import { isEqual } from 'lodash';
import { autorun, IMapDidChange } from 'mobx';
import requireGlob from 'require-glob';
import { Browser } from '../Setup/Application/Browser';
import { Plugin as Setup } from '../Setup/Application/Plugin';
import { Rectangle } from '../Setup/Default/Rectangle';
import { SimpleRectangle } from '../Setup/Default/RectangleInterface';
import { callerAndfName } from '../utils/debugging';
import { Plugin } from './Plugin';
import { Registration } from './PluginInterface';
import { setInterval, clearInterval } from 'timers';

const pluginDir = 'D:\\Dennis\\Projects\\wallpaper-plugins\\dist\\src\\';

type PluginReg = Registration;
type InnerPlugin = { default: PluginReg };
type PluginModule = InnerPlugin | PluginReg;
type PluginImports = { [key: string]: PluginModule | PluginImports };
type FlatImports = { [key: string]: PluginReg };


export class Manager {

    static readonly registrations = new Map<string, PluginReg>();

    static async loadAll(): Promise<void> {
        // console.log(`${callerAndfName()}() current=${Manager.registrations.size}`);

        await Manager.loadPlugins('**/*');
    }


    private static processImports = (imports: PluginImports, path: string): void => {
        // console.log(`Manager.processImports(${path}) current=${Manager.registrations.size} got=${Object.keys(imports).length}`);

        for (const [id, mix] of Object.entries(imports)) {
            const fullId = path + id;

            if (!Manager.registrations.has(fullId)) {
                const registration = (mix as InnerPlugin).default ?? mix as PluginReg;

                if (registration.schema) {
                    console.log(`Manager.processImports(${path}, ${id}): add ${fullId}`);

                    try {
                        Setup.add(registration.schema);
                        Manager.registrations.set(fullId, registration);
                    } catch (error) {
                        console.error(`Manager.processImports(${path}, ${id}): add ${fullId}.schema caused: ${error}`, mix, registration, error);
                    }

                } else if (typeof mix == 'object') {
                    Manager.processImports(mix as PluginImports, fullId + '/');
                } else {
                    console.error(`Manager.processImports(${path}, ${id}): ${fullId} has no schema nor object:`, mix, registration);
                }
            } else {
                console.warn(`Manager.processImports(${path}, ${id}): ${fullId} already registered`);
            }
        }

    }

    /**
     * 
     * @param prefix use '*' to load all, otherwise the className 
     */
    static async loadPlugins(prefix: string): Promise<void> {
        // console.log(`${callerAndfName()}(${prefix}) current=${Manager.registrations.size}`);

        let mixed: PluginImports | undefined;

        try {
            mixed = await requireGlob([prefix + '.js'], { cwd: pluginDir });
        } catch (error) {
            console.error(`Manager.loadPlugins(${prefix}) requireGlob threw: ${error}`, error);
        }

        if (!mixed)
            return;

        console.log(`${callerAndfName()}(${prefix}) current=${Manager.registrations.size} got=${Object.keys(mixed).length}`);

        Manager.processImports(mixed, '');
    }

    static getRegistration(id: string): Registration | undefined {
        for (const [fullId, registration] of Manager.registrations.entries()) {
            if ((id == fullId) || (fullId.endsWith('/' + id))) {
                return registration;
            }
        }
        return undefined;
    }

    async load(className: string): Promise<Registration> {
        // console.log(`${this.constructor.name}[${this.browser.id}].load(${className}) current=${Manager.registrations.size}`);

        let registration = Manager.getRegistration(className);

        if (!registration)
            await Manager.loadPlugins(className);

        registration = Manager.getRegistration(className);

        if (!registration)
            throw new Error(`${callerAndfName()}(${className}) failed`);

        return registration;
    }

    private performanceInterval;
    private updatePerformance = (): void => {
        this.browser.cpuUsage = process.getCPUUsage().percentCPUUsage / 100;
    }

    private setPerformanceInterval = (): void => {
        this.performanceInterval && clearInterval(this.performanceInterval);

        this.performanceInterval = setInterval(this.updatePerformance, this.browser.performanceInterval);
    }

    constructor(private browser: Browser) {
        browser.pid = process.pid;
        autorun(this.setPerformanceInterval);

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
            x: Number((this.browser.scaled.width * setup.relativeBounds.x).toPrecision(18)),
            y: Number((this.browser.scaled.height * setup.relativeBounds.y).toPrecision(18)),
            width: Number((this.browser.scaled.width * setup.relativeBounds.width).toPrecision(18)),
            height: Number((this.browser.scaled.height * setup.relativeBounds.height).toPrecision(18))
        };

        if (!setup.scaledBounds) {
            // console.log(
            //     `${this.constructor.name}[${this.browser.id}].updateBounds(${setup.id}) set scaled=${[scaled.x, scaled.y, scaled.width, scaled.height]}`);

            setup.scaledBounds = Rectangle.create(setup.id, 'scaledBounds', scaled);
        } else if (!isEqual(setup.scaledBounds.toSimple(), scaled)) {
            if ((setup.scaledBounds.x != scaled.x) && (setup.scaledBounds.y != scaled.y)
                && (setup.scaledBounds.height != scaled.height) && (setup.scaledBounds.width != scaled.width)) {
                // console.log(
                //     `${this.constructor.name}[${this.browser.id}].updateBounds(${setup.id}) new scaled=${[scaled.x, scaled.y, scaled.width, scaled.height]}`);

                setup.scaledBounds = Rectangle.create(setup.id, 'scaledBounds', scaled);
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
        console.log(`${this.constructor.name}[${this.browser.id}].addPlugin(${setup.id}) current=${Manager.registrations.size}`);

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
            console.error(`${this.constructor.name}[${this.browser.id}].addPlugin(${setup.id}) failed: ${error}`, error);
        }
    }
}