import controller from '../../infrastructure/Configuration/Controller';
import { Browser } from '../../infrastructure/Configuration/WallpaperSetup';


export class PluginManager {
    private static browserId: string;
    private static browser: Browser | undefined;

    static async run(): Promise<void> {
        const browserIdArg = process.argv.find((arg) => /^--browserid=/.test(arg));

        if (!browserIdArg) {
            console.error(`PluginManager.run() missing arguments: browserId=${browserIdArg}`, process.argv);
            throw new Error(`PluginManager.run() missing arguments: browserId=${browserIdArg}: ${process.argv.join()}`);
        }
        PluginManager.browserId = browserIdArg.split('=')[1];
        
        PluginManager.browser = (await controller.getSetup(PluginManager.browserId, -1)) as Browser;
    }
}

