import { PluginSetupItem } from './PluginSetup';

export interface PluginFactory {
    (config: PluginSetupItem): Plugin;
}

export class Plugin {
    constructor(protected setup: PluginSetupItem) {
    }

    private static factories = new Map<string, PluginFactory>();

    public static create(config: PluginSetupItem): Plugin {
        const factory = Plugin.factories.get(config.className);

        if (!factory) throw new Error(`Plugin.create() no factory for ${config.className}`);

        return factory(config);
    }

    public static register(className: string, factory: PluginFactory): void {
        console.log(`PluginManager.register ${className}`);

        Plugin.factories.set(
            className,
            factory
        );
    }

}
