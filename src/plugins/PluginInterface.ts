import { PluginInterface as SetupInterface } from '../Setup/Application/PluginInterface';
import { JSONSchema7 } from 'json-schema';


export interface PluginInterface {
    active: boolean;
    render(gradient): void;
}

export interface PluginConstructor<PluginType extends PluginInterface> {
    new(config: SetupInterface, root: HTMLCanvasElement): PluginType;
}


export interface Registration<PluginClass extends PluginInterface> {
    plugin: PluginConstructor<PluginClass>;
    schema: JSONSchema7;
}

