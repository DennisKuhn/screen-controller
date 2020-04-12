import { ipcRenderer } from 'electron';
import crypto from 'crypto';
import url, { Url } from 'url';
import fs from 'fs';

declare global {
    interface Window {
        wallpaper: {
            register: (listeners: { user: (settings: ConfigProperties) => void }) => void;
        };
    }
}

export interface PaperConfig {
    contentrating: string;
    description: string;
    file: string;
    preview: string;
    title: string;
    type: string;
    visibility: string;
    tags: string[];
    general: {
        supportsaudioprocessing: boolean;
        properties: ConfigProperties;
    };
}

export interface ConfigProperties {
    [key: string]: ConfigProperty;

}

export interface ConfigOption {
    label: string;
    value: string;
}

export interface ConfigProperty {
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

    baseUrl: Url;
    private baseId: string;
    displayId: number;

    configId: string;

    config: PaperConfig;
    userProperties: ConfigProperties;

    constructor(displayId: number, baseUrl: Url) {
        this.baseUrl = baseUrl; // url.pathToFileURL(file);

        this.baseId = crypto.createHash('md5').update(this.baseUrl.href).digest('hex');

        this.displayId = displayId;

        this.configId = `${this.displayId}-${this.baseId}-config`;

        console.log(`${this.constructor.name}(): ${this.configId} = ${this.displayId} + ${this.baseId} (${this.baseUrl.href})`);

        this.loadConfig();
    }

    private loadConfig(): void {
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
    static CHANNEL = '-userSettings';

    /**
     * Called by wallpaper-preloader to get initial config and updates
     */
    static start(): void {
        const displayId = Number(
            process.argv.find((arg) => /^--displayid=/.test(arg) ).split('=')[1]);
        // Get displayId from argV and url from window.location.href
        ConfigController.getConfig(
            displayId,
            url.parse(window.location.href, false, false)
        ).then(
            () => {
                ConfigController.connectToWallpaper();
            }
        );
    }

    static async getConfig(displayId: number, baseUrl: Url): Promise<PaperConfig> {
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

    private static settings: ConfigSettings[] = [];

    private static listeners: { user: (settings: ConfigProperties) => void };

    private static onNewSettings = async (e, settingText: string): Promise<void> => {
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

    private static registerPage = (listeners: { user: (settings: ConfigProperties) => void }): void => {
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
            ipcRenderer.on(setting.configId + ConfigController.CHANNEL, ConfigController.onNewSettings);
        }
    }

    /**
     * Exposes interface to wallpaper window, e.g. window.wallpaper.register(listeners)
     */
    private static connectToWallpaper(): void {
        // Expose protected methods that allow the renderer process to use
        // the ipcRenderer without exposing the entire object
        window.wallpaper = {
            register: ConfigController.registerPage
        };
    }
}

export default ConfigController;
