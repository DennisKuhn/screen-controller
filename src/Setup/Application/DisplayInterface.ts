import { SetupBaseInterface, Dictionary } from '../SetupInterface';
import { Browser } from './BrowserInterface';

export interface Display extends SetupBaseInterface {
    browsers: Dictionary<Browser>;
}