import createAndAppend from '../utils/tools';
import ConfigController from '../infrastructure/ConfigController';

/** */
class ConfigEditor {

    config;
    userProperties;
    configKey: string;

    /**
     *
     * @param {Element} parent element to attach editor to
     * @param {URL} file path of the page
     * @param {number} displayId id of the display
     */
    constructor(parent: Element, displayId: number, file: URL) {

        ConfigController.getConfig(displayId, file)
            .then(config => {
                this.config = config;
                this.userProperties = this.config.general.properties;
                console.log(`${this.constructor.name}:${displayId}: got Config`, this.config);
                this.createEditor(parent);
            })
            .catch((fileLoadError) => {
                console.error(
                    `${this.constructor.name}: ${this.configKey}: Error loading default config:${fileLoadError} file: ${file}`,
                    fileLoadError);
            });
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
}

export default ConfigEditor;
