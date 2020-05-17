import { Plugin as Setup } from '../Setup/Application/Plugin';
import { Registration, PluginInterface } from './PluginInterface';
import requireGlob from 'require-glob';

const pluginDir = 'D:\\Dennis\\Projects\\screen-controller\\plugins';

type PluginReg = Registration<PluginInterface>;
type InnerPlugin = { default: PluginReg };
type PluginModule = InnerPlugin | PluginReg;
type PluginImports = { [key: string]: PluginModule };
type FlatImports = { [key: string]: PluginReg };


export class Manager {

    static readonly registrations: FlatImports = {};

    static async loadAll(): Promise<void> {
        const loaded = Object.keys(Manager.registrations).length;

        console.log(`${this.constructor.name}.loadAll() current=${loaded}`);

        const mixed: PluginImports = await requireGlob(['*.js'], { cwd: pluginDir });
        const flat: FlatImports = {};

        for (const [id, mix] of Object.entries(mixed)) {
            flat[id] = (mix as InnerPlugin).default ?? mix as PluginReg;
        }

        for (const [id, registration] of Object.entries(flat)) {
            if (!(id in Manager.registrations)) {
                console.log(`${this.constructor.name}.loadAll() add ${id}`);
                Manager.registrations[id] = registration;
                Setup.add(registration.schema);
            }
        }
    }

    async load(className: string): Promise<void> {
        console.log(`${this.constructor.name}.load(${className})`);
    }
}