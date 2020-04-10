import { ipcRenderer } from 'electron';
import crypto from 'crypto';
import url, { URL } from 'url';
import fs from 'fs';

class ConfigOption {
    label: string;
    value: string;
}

class ConfigProperty {
    condition: string;
    order: number;
    text: string;
    type: string;
    max: number;
    min: number;
    value: string;
    options: ConfigOption[];
}

class ConfigSettings {

    baseUrl: URL;
    baseId: string;
    displayId: number;

    configId: string;

    config;
    userProperties;

    /**
     * 
     */
    constructor(displayId: number, baseUrl: URL) {
        this.baseUrl = baseUrl; // url.pathToFileURL(file);

        this.baseId = crypto.createHash('md5').update(this.baseUrl.href).digest('hex');

        this.displayId = displayId;

        this.configId = `${this.displayId}-${this.baseId}-config`;

        console.log(`${this.constructor.name}(): ${this.configId} = ${this.displayId} + ${this.baseId} (${this.baseUrl.href})`);

        this.loadConfig();
    }

    loadConfig(): void {
        console.log(`${this.constructor.name}: ${this.configId}`);
        const configString = localStorage.getItem(this.configId);

        if (configString) {
            try {
                this.config = JSON.parse(configString);
                this.userProperties = this.config.general.properties;

                console.log(`${this.constructor.name}: ${this.configId}: loaded config`, this.userProperties, this.config);
            } catch (loadConfigError) {
                console.error(
                    `${this.constructor.name}: ${this.configId}: Error parsing config JSON:${loadConfigError}: ${configString} file: ${this.baseUrl.href}`,
                    loadConfigError,
                    configString);
            }
        } else {
            console.warn(`${this.constructor.name}: ${this.configId}: no config: ${this.baseUrl.href}`);
        }
    }

    /**
     *
     * @param {string} file path
     */
    async loadDefault(): Promise<void> {
        const defaultLocation = this.baseUrl.href.substring(0, this.baseUrl.href.lastIndexOf('/') + 1) + 'project.json';
        const defaultPath = url.fileURLToPath(this.baseUrl.href.substring(0, this.baseUrl.href.lastIndexOf('/') + 1) + 'project.json');
        console.log(`${this.constructor.name}: ${this.configId}: defaultLocation: ${defaultLocation} defaultPath: ${defaultPath} file: ${this.baseUrl.href}`);
        try {
            // const buffer = await fs.promises.readFile(defaultLocation);
            const buffer = await fs.promises.readFile(defaultPath);
            this.config = JSON.parse(buffer.toString());

            this.userProperties = this.config.general.properties;

            console.log(`${this.constructor.name}: ${this.configId}: loaded default`, this.userProperties, this.config);
        } catch (loadError) {
            console.error(
                `${this.constructor.name}: ${this.configId}: ERROR loading default:${loadError}:${defaultLocation}`,
                loadError,
                defaultLocation);
        }
        if (this.config) {
            try {
                localStorage.setItem(this.configId, JSON.stringify(this.config));

                console.log(`${this.constructor.name}: ${this.configId}: stored default`, this.config);
            } catch (storeError) {
                console.error(
                    `${this.constructor.name}: ${this.configId}: ERROR storing default:${storeError}:${defaultLocation}`,
                    storeError,
                    defaultLocation);
            }
        }
    }
}

/**
 * Loads configuration from storage and provides interface to configuration updates through channel.
 * @module
 */
class ConfigController {

    static settings: ConfigSettings[] = [];

    static async getConfig(displayId: number, baseUrl: URL): Promise<any> {
        let setting = ConfigController.settings.find(candidate => candidate.displayId == displayId && candidate.baseUrl == baseUrl);

        if (!setting) {
            setting = new ConfigSettings(displayId, baseUrl);
            ConfigController.settings.push(setting);

            if (!setting.config) {
                await setting.loadDefault();
            }
        }
        return setting.config;
    }

    /**
     * 
     */
    constructor() {
        console.error(`${this.constructor.name}()`);
    }

    static start(): void {
        // Get displayId from argV and url from window.locaiton.href
        ConfigController.getConfig(
            Number(
                process.argv.find((arg) => {
                    return /^--displayid=/.test(arg);
                }).split('=')[1]),
            url.parse(window.location.href, false, false)
        ).then(
            () => {
                ConfigController.connectToWallpaper();
            }
        );
    }

    static listeners: { user: (settingText: string) => void};

    static onNewSettings = async (e, settingText: string): Promise<void> => {
        const setting = ConfigController.settings[0];

        try {
            const changedSettings = await JSON.parse(settingText);
            ConfigController.listeners.user(changedSettings);
        } catch (settingsError) {
            console.error(
                `ConfigController: ${setting.configId}: ERROR updating user setting:${settingsError}:${settingText}`,
                settingsError,
                settingText);
        }
    }

    static registerPage = (listeners: { user: (settingText: string) => void }): void => {
        const setting = ConfigController.settings[0];
        
        ConfigController.listeners = listeners;

        console.log(
            `ConfigController: ${setting.configId}: ${Object.keys(setting.userProperties).length}: register`,
            listeners,
            setting.userProperties);
        if (ConfigController.listeners.user) {
            try {
                ConfigController.listeners.user(setting.userProperties);
            } catch (initialError) {
                console.error(
                    `ConfigController: ${setting.configId}: ERROR initial user setting:${initialError}:`,
                    initialError,
                    setting.userProperties);
            }
            ipcRenderer.on(setting.configId + '-userSettings', ConfigController.onNewSettings);
        }
    }

    /**
     * Exposes interface to wallpaper window, e.g. window.wallpaper.register(listeners)
     */
    static connectToWallpaper(): void {
        // Expose protected methods that allow the renderer process to use
        // the ipcRenderer without exposing the entire object
        window.wallpaper = {
            register: ConfigController.registerPage
        };
    }
}

export default ConfigController;
