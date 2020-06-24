import { SetupBaseInterface, Dictionary } from '../SetupInterface';
import { PluginInterface } from './PluginInterface';

export interface Browser extends SetupBaseInterface {
    plugins: Dictionary<PluginInterface>;
}