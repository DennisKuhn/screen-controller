import { SetupConstructor } from '../Setup/SetupBase';
import { Plugin as Setup } from '../Setup/Application/Plugin';
import { JSONSchema7 } from 'json-schema';

export abstract class PluginBase {
    constructor(setup: Setup) {
        console.log(`PluginBase(${this.constructor.name})[${setup.id}]`);
    }
}

export interface PluginConstructor<PluginType extends PluginBase> {
    new(config: Setup): PluginType;
}

export interface Registration<PluginClass extends PluginBase, SetupClass extends Setup> {
    plugin: PluginConstructor<PluginClass>;
    setup: SetupConstructor<SetupClass>;
    schema: JSONSchema7;
}

