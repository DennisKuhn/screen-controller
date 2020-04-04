const {
  ipcRenderer
} = require('electron');
const crypto = require('crypto');
/**
 * Loads configuration from storage and provides interface to configuration updates through channel.
 * @module
 */
class ConfigManager {

  /** @type {string} */
  locationHref;

  /** @type {string} */
  sourceId;

  /** @type {string} */
  displayId;

  /** @type {string} */
  settingsId;

  config;
  userProperties;

  /**
   * 
   */
  constructor() {
    this.locationHref = window.location.href;
    this.sourceId = crypto.createHash('md5').update(this.locationHref).digest('hex');

    this.displayId = process.argv.find((arg) => {
      return /^--displayid=/.test(arg);
    }).split('=')[1];

    this.settingsId = `${this.displayId}-${this.sourceId}-config`;

    console.log(`${this.constructor.name}(): ${this.settingsId} = ${this.displayId} + ${this.sourceId} (${this.locationHref})`);

    this.loadConfig();

    this.connectToWallpaper();
  }

  /**
   * Exposes interface to wallpaper window, e.g. window.wallpaper.register(listeners)
   */
  connectToWallpaper() {
    // Expose protected methods that allow the renderer process to use
    // the ipcRenderer without exposing the entire object
    window.wallpaper = {
      register: (listeners) => {
        console.log(
          `${this.constructor.name}: ${this.settingsId}: ${Object.keys(this.userProperties).length}: register`,
          listeners,
          this.userProperties);
        if (listeners.user) {
          try {
            listeners.user(this.userProperties);
          } catch (initialError) {
            console.error(
              `${this.constructor.name}: ${this.settingsId}: ERROR initial user setting:${initialError}:`,
              initialError,
              this.userProperties);
          }
          ipcRenderer.on(this.settingsId + '-userSettings', async (e, settingText) => {
            try {
              const changedSettings = await JSON.parse(settingText);
              listeners.user(changedSettings);
            } catch (settingsError) {
              console.error(
                `${this.constructor.name}: ${this.settingsId}: ERROR updating user setting:${settingsError}:${settingText}`,
                settingsError,
                settingText);
            }
          });
        }
      }
    };
  }

  /**
   *
   */
  loadConfig() {
    console.log(`${this.constructor.name}: ${this.settingsId}`);
    const configString = localStorage.getItem(this.settingsId);

    if (configString) {
      try {
        this.config = JSON.parse(configString);
        this.userProperties = this.config.general.properties;

        console.log(`${this.constructor.name}: ${this.settingsId}: loaded config`, this.userProperties, this.config);
      } catch (loadConfigError) {
        console.error(
          `${this.constructor.name}: ${this.settingsId}: Error parsing config JSON:${loadConfigError}: ${configString} file: ${this.locationHref}`,
          loadConfigError,
          configString);
      }
    } else {
      console.warn(`${this.constructor.name}: ${this.settingsId}: no config: ${this.locationHref}`);
    }
  }
}

module.exports = ConfigManager;
