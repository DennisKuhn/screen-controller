const ConfigManager = require('./configmanager');

process.once('loaded', () => {
  global.configManager = new ConfigManager();
});
