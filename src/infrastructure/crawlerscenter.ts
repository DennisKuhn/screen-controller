import DirectoryCrawler from './directorycrawler';
import Url, { fs2Url } from '../utils/Url';
import { callerAndfName } from '../utils/debugging';

type RejectCallback = (reason: string) => void;

interface WaitingCrawler {
    resolve: () => void;
    reject: RejectCallback;
    file: string;
}

interface WaitingConsumer {
    resolve: (file: string) => void;
    reject: RejectCallback;
}


class CrawlersCenter {

    /** Start location */
    root?: Url;

    constructor(options: {
        crawlerCount?: number;
        bufferSize?: number;
        batchSize?: number;
    }) {
        this.maxCrawlers = options.crawlerCount ? options.crawlerCount : this.maxCrawlers;
        this.maxFiles = options.bufferSize ? options.bufferSize : this.maxFiles;
        this.crawlerBatchSize = options.batchSize ? options.batchSize : this.crawlerBatchSize;
    }

    stop(): Promise<void> {
        return new Promise((resolve) => {
            this.onTerminate = resolve;
            this.crawling.forEach(crawler => crawler.terminate());
            this.waitingCrawlers.forEach(info => info.reject('Stop crawling'));
            this.waitingCrawlers.length = 0;
            this.waitingConsumers.forEach(info => info.reject('Stopping crawling'));
            this.waitingConsumers.length = 0;            
        });
    }

    /**
     * Starts first crawler at root directory.
     * Ignore: Promise fullfills after initial crawler is finished
     * Important: Promise rejects if rootCrawler fails to open root directory
     * @param {string} rootDirectory
     */
    async start(rootDirectory: string): Promise<void> {
        this.root = fs2Url(rootDirectory);

        // console.log(`${callerAndfName()}: ${rootDirectory} => ${this.root}`, this.root);

        await this.spawnFolder(this.root)
            .catch(reason => {
                console.error(`${callerAndfName()}: crawler.run.catch at root: ${reason}`, reason);
                throw reason;
            });
    }

    // canSpan = (): boolean => this.crawling.length < this.maxCrawlers;
    get canSpan(): boolean {
        return this.crawling.length < this.maxCrawlers;
    }

    /**
     *
     * @param {Url} folder
     * @returns {boolean} true if started a crawler for the folder. Returns false if all crawler slots are active at the moment
     */
    async spawnFolder(folder: Url): Promise<void> {
        // console.log(`${callerAndfName()} ${this.canSpan} ${this.crawling.length} =? ${this.maxCrawlers} ${folder}`);
        if (this.onTerminate) {
            throw new Error(`${this.constructor.name}: spawnFolder stopping`);
        } else if (this.canSpan) {
            const crawler = new DirectoryCrawler(this, this.crawlerBatchSize);
            this.crawling.push(crawler);
            // console.log(`${callerAndfName()} => ${this.crawling.length} ${folder}`);
            await crawler.run(folder)
                .finally(() => {
                    this.removeCrawler(crawler);
                });
        } else {
            throw new Error(`${this.constructor.name}: spawnFolder when full`);
        }
    }

    /**
     * IF the last crawler has been removed, start again with spawnFolder(this.root)
     * @param {DirectoryCrawler} crawler
     */
    removeCrawler(crawler: DirectoryCrawler): void {
        // console.log(`${callerAndfName()} @${this.waitingNew.length} ${crawler.relativePath}`);
        const i = this.crawling.indexOf(crawler);
        // console.log(`${callerAndfName()} found @${i}/${this.crawling.length} ${crawler.relativePath}`);
        this.crawling.splice(i, 1);

        if (this.crawling.length == 0) {
            if (this.onTerminate) {
                // console.log(`${callerAndfName()}: call onTerminate`);
                this.onTerminate();
                this.onTerminate = undefined;
            } else {
                // console.log(`${callerAndfName()}: crawler.run.then: restarting at root`);
                if (!this.root) {
                    throw new Error(`${callerAndfName()}(): No crawlers, respawn at NO ROOT`);
                }
                this.spawnFolder(this.root);
            }
        }
    }

    /**
     *
     * @param {string} file
     * @returns {Promise}
     */
    addFile(file: string): Promise<void> {
        // console.log(`${callerAndfName()} @${this.filesBuffer.length},${this.waitingConsumers.length} = ${file}`);
        return new Promise((resolve, reject) => {
            const waitingConsumer = this.waitingConsumers.shift();
            if (waitingConsumer) {
                // console.log(`${callerAndfName()} resolve waitingConsumer ${this.waitingConsumers.length} = ${file}`);
                waitingConsumer.resolve(file);
                resolve();
            } else {
                if (this.filesBuffer.length == this.maxFiles) {
                    //console.log(`${callerAndfName()} add to waitingCrawlers @${this.waitingCrawlers.length} == ${this.maxFiles} = ${file}`);
                    this.waitingCrawlers.push({ resolve: resolve, reject: reject, file: file });
                } else if (this.filesBuffer.length >= this.maxFiles) {
                    console.error(`${callerAndfName()} add to waitingCrawlers @${this.waitingCrawlers.length} > ${this.maxFiles} = ${file}`);
                    this.waitingCrawlers.push({ resolve: resolve, reject: reject, file: file });
                } else {
                    //console.log(`${callerAndfName()} push filesBuffer, resolve @${this.filesBuffer.length} = ${file}`);
                    this.filesBuffer.push(file);
                    resolve();
                }
            }
        });
    }

    /**
     *
     * @returns {Promise}
     */
    getFile(): Promise<string> {
        return new Promise((resolve, reject) => {
            // console.log(`${callerAndfName()} consumerQ=${this.waitingConsumers.length} buffer=${this.filesBuffer.length} crawlerQ=${this.waitingCrawlers.length}`);
            if (this.onTerminate) {
                reject('stopping');
            } else if (this.crawling.length == 0) {
                reject('no crawlers');
            } else if (this.filesBuffer.length == 0) {
                // console.log(`${callerAndfName()} add to waitingConsumers @${this.waitingConsumers.length} @${this.filesBuffer.length} == 0`);
                this.waitingConsumers.push({ resolve: resolve, reject: reject });
            } else {
                const file = this.filesBuffer.shift();
                // console.log(`${callerAndfName()} sclice filesBuffer, resolve @${this.filesBuffer.length}, waitingCrawlers=${this.waitingCrawlers.length}`, ${file});
                const crawler = this.waitingCrawlers.pop();
                if (crawler) {
                    this.filesBuffer.push(crawler.file);
                    crawler.resolve();
                }

                resolve(file);
            }
        });
    }

    /** Maximum fileBuffer length */
    private maxFiles = 2;

    private filesBuffer: string[] = [];

    /**
     * Default node directory read block size is 32
     */
    private crawlerBatchSize = 32;

    /**
     * More crawlers more random
     *  @type {number} */
    private maxCrawlers = 6;

    /**
     * Active Crawlers
     */
    private crawling: DirectoryCrawler[] = [];

    /**
     * @type {WaitingCrawler[]}
     */
    private waitingCrawlers: WaitingCrawler[] = [];


    /**
     * @type {WaitingConsumer[]}
     */
    private waitingConsumers: WaitingConsumer[] = [];

    private onTerminate: (() => void) | undefined = undefined;
}



export default CrawlersCenter;
