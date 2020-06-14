import { Renderer } from './Renderer';
import { Browser } from '../Application/Browser';

type Size = { width: number; height: number };
type SizeCallback = (size: Size) => void;

/**
 * Renderer Config Controller for Wallpaper Browsers. Deal with size
 */
export class Paper extends Renderer {
    private browserId: string;
    private browser: Browser | undefined;


    constructor() {
        super();

        const browserIdArg = process.argv.find((arg) => /^--browserid=/.test(arg));

        if (!browserIdArg) {
            console.error(`${this.constructor.name}() missing arguments: browserId=${browserIdArg}`, process.argv);
            throw new Error(`${this.constructor.name}() missing arguments: browserId=${browserIdArg}: ${process.argv.join()}`);
        }
        this.browserId = browserIdArg.split('=')[1];

        // console.log(`${this.constructor.name}[${this.browserId}]()`, process.argv);
    }

    async getBrowser(): Promise<Browser> {
        if (!this.browser) {
            this.browser = await this.getSetup(this.browserId, -1) as Browser;

            // console.log(
            //     `${this.constructor.name}[${this.browserId}](): got Browser (${this.browser.plugins.size}):` +
            //     ` width=${this.browser.relative.width}/${this.browser.scaled?.width}/${this.browser.device?.width}` +
            //     ` height=${this.browser.relative.height}/${this.browser.scaled?.height}/${this.browser.device?.height}`,
            //     this.browser
            // );
        }
        return this.browser;
    }
}
