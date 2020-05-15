
const pluginDir = 'D:\\Dennis\\Projects\\screen-controller\\plugins';

import requireGlob from 'require-glob';

type PluginModule = { default: PluginLoader } & PluginLoader;
type PluginImports = { [key: string]: PluginModule };

export default function(): Promise<PluginLoader[]> {
    return requireGlob(['**/*.js'], { cwd: pluginDir })
        .then((plugins: PluginImports) => Object.values(plugins)
            .map((p: PluginModule) => {
                return ((p.default ? p.default : p) as unknown) as PluginLoader;
            })
        );
}