import createAndAppend from '../utils/tools';
import fs from 'fs';

/** */
class ConfigEditor {

    config;
    userProperties;
    configKey: string;

    /**
     *
     * @param {Element} parent element to attach editor to
     * @param {string} file path of the page
     * @param {string} configKey used to identify configuration slot
     */
    constructor(parent: Element, file: string, configKey: string) {
        this.configKey = configKey;

        const configString = localStorage.getItem(this.configKey);

        if (configString) {
            try {
                this.config = JSON.parse(configString);
            } catch (loadConfigError) {
                console.error(
                    `${this.constructor.name}: ${this.configKey}: Error parsing config JSON:${loadConfigError}: ${configString} file: ${file}`,
                    loadConfigError,
                    configString);
            }
        }
        if (!this.config || !this.config.general || !this.config.general.properties) {
            this.loadDefault(file)
                .then(() => {
                    if (this.config) {
                        console.log(`${this.constructor.name}:${configKey}: Loaded defaults`, this.config);
                        this.createEditor(parent);
                    }
                })
                .catch((fileLoadError) => {
                    console.error(
                        `${this.constructor.name}: ${this.configKey}: Error loading default config:${fileLoadError} file: ${file}`,
                        fileLoadError);
                });
        } else {
            console.log(`${this.constructor.name}:${configKey}: Loaded from storage`, this.config);
            this.userProperties = this.config.general.properties;
            this.createEditor(parent);
        }
    }

    /**
     *
     * @param {Element} parent element to attach editor to
     */
    createEditor(parent: Element): void {
        const editor = createAndAppend<HTMLDivElement>('div', {
            parent: parent,
            className: 'configEditor'
        });

        Object.entries(this.userProperties)
            .sort(([, fielda], [, fieldb]) => {
                return fielda.order - fieldb.order;
            })
            .forEach(([, field]) => {
                const wrapper = createAndAppend<HTMLDivElement>('div', {
                    parent: editor,
                    className: 'field'
                });

                createAndAppend('span', {
                    parent: wrapper,
                    className: 'title',
                    html: field.text
                });

                switch (field.type) {
                    case 'textinput': {
                        const textInput = createAndAppend<HTMLInputElement>('input', {
                            parent: wrapper,
                            className: 'editor'
                        });
                        if (field.value) {
                            textInput.value = field.value;
                        }
                    }
                        break;
                    default:
                        createAndAppend('span', {
                            parent: wrapper,
                            className: 'editor',
                            text: field.value
                        });
                }
            });
    }

    /**
     *
     * @param {string} file path
     */
    async loadDefault(file: string) {
        const defaultLocation = file.substring(0, file.lastIndexOf('\\') + 1) + 'project.json';
        console.log(`${this.constructor.name}: ${this.configKey}: default: ${defaultLocation} file: ${file}`);
        try {
            // const response = await fetch(defaultCLocation);
            // const response =  fs.readFileSync(defaultLocation)
            this.config = JSON.parse(fs.readFileSync(defaultLocation).toString());

            this.userProperties = this.config.general.properties;

            console.log(`${this.constructor.name}: ${this.configKey}: loaded default`, this.userProperties, this.config);
        } catch (loadError) {
            console.error(
                `${this.constructor.name}: ${this.configKey}: ERROR loading default:${loadError}:${defaultLocation}`,
                loadError,
                defaultLocation);
        }
        if (this.config) {
            try {
                localStorage.setItem(this.configKey, JSON.stringify(this.config));

                console.log(`${this.constructor.name}: ${this.configKey}: stored default`, this.config);
            } catch (storeError) {
                console.error(
                    `${this.constructor.name}: ${this.configKey}: ERROR storing default:${storeError}:${defaultLocation}`,
                    storeError,
                    defaultLocation);
            }
        }
    }
}

export default ConfigEditor;
