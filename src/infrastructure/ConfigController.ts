import { ipcRenderer } from 'electron';
import crypto from 'crypto';
import Url, { href2Url, href2fs, url2store, store2url } from '../utils/Url';
import fs from 'fs';
import { Display2StorageKey } from './WallpapersManager.ipc';

import { Properties, Config } from './Configuration/WallpaperSetup';

declare global {
    interface Window {
        wallpaper: {
            register: (listeners: { user: (settings: Properties) => void }) => void;
        };
    }
}


class ConfigSettings {

    baseUrl: Url;
    private baseId: string;
    displayId: number;

    configId: string;

    config: Config;
    userProperties: Properties;

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
        try {
            const defaultLocation = this.baseUrl.href.substring(0, this.baseUrl.href.lastIndexOf('/') + 1) + 'project.json';
            const defaultPath = href2fs(defaultLocation);

            console.log(`${this.constructor.name}: ${this.configId}: defaultLocation: ${defaultLocation} defaultPath: ${defaultPath} file: ${this.baseUrl.href}`);
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

type Size = { width: number; height: number };
type UserCallback = (settings: Properties) => void;
type SizeCallback = (size: Size) => void;
type Listeners = { user?: UserCallback; size?: SizeCallback };

/**
 * Loads configuration from storage and provides interface to configuration updates through channel.
 * @module
 */
class ConfigController {
    private static settings: ConfigSettings[] = [];
    static CHANNEL = '-userSettings';


    static async getConfig(displayId: number, baseUrl: Url): Promise<Config> {
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

    static setFile(displayId: number, file: Url): void {
        const key = Display2StorageKey(displayId);
        const storage = url2store(file);

        localStorage.setItem(key, storage);
    }

    static getFile(displayId: number): Url {
        const key = Display2StorageKey(displayId);
        const storage = localStorage.getItem(key);    
        let fileUrl: Url;

        if (storage) {
            fileUrl = store2url(storage);
        }

        return fileUrl;
    }



    /**
     * Triggered by a Wallpaper config editor IPC send
     */
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

    /**
     * Called by wallpaper-preloader to get initial config and updates
     */
    static start(): void {
        const displayId = Number(
            process.argv.find((arg) => /^--displayid=/.test(arg)).split('=')[1]);

        ConfigController.displayWidth = Number(
            process.argv.find((arg) => /^--displaywidth=/.test(arg)).split('=')[1]);

        ConfigController.displayHeight = Number(
            process.argv.find((arg) => /^--displayheight=/.test(arg)).split('=')[1]);

        ConfigController.getConfig(
            displayId,
            href2Url(window.location.href)
        ).then(
            () => {
                ConfigController.connectToWallpaper();
            }
        );
    }

    private static displayWidth: number;
    private static displayHeight: number;
    private static listeners: Listeners;

    private static registerPage = (listeners: Listeners): void => {
        const setting = ConfigController.settings[0];

        ConfigController.listeners = listeners;

        console.log(
            `ConfigController: ${setting.configId}: ${Object.keys(setting.userProperties).length}: register`,
            listeners,
            setting.userProperties);
        
        ConfigController.initUserListener();

        ConfigController.initSizeListener();
    }

    private static initUserListener(): void {
        if (ConfigController.listeners.user) {
            const setting = ConfigController.settings[0];

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

    private static initSizeListener(): void {
        if (ConfigController.listeners.size) {
            const size: Size = { width: ConfigController.displayWidth, height: ConfigController.displayHeight};

            try {
                ConfigController.listeners.size(size);
            } catch (initialError) {
                console.error(
                    `ConfigController: ${JSON.stringify(size)}: ERROR initial size setting:${initialError}:`,
                    initialError,
                    size);
            }
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
