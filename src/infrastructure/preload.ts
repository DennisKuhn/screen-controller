const ConfigManager = require('src/infrastructure/configmanager');

process.once('loaded', () => {
  global.configManager = new ConfigManager();
});
