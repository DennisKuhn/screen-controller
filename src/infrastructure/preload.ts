import controller from './Configuration/Controller';
import PluginLoader from '../pluginloader';
console.log('preload included');

process.once('loaded', () => {

    PluginLoader().then(plugins => {
        console.log(plugins);
        for (const plugin of Object.values(plugins)) {
            console.log(plugin.name);
            plugin.Setup();
        }
    });
});
