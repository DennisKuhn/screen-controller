import ConfigManager from './configmanager';

let configManager;
console.log('preload included')
process.once('loaded', () => {
    configManager = new ConfigManager();
});
