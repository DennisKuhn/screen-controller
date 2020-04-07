const fs = require('fs');
const url = require('url');

const CrawlersCenter = require('./crawlerscenter');


class DirectoryCrawler {

    /** @type {CrawlersCenter} */
    center;

    /** @type {URL} */
    root;

    /** @type {string} */
    relativePath;

    /** @type {fs.Dir} */
    directory;

    /** @type {URL[]} */
    directoriesQueue = [];

    /**
     * Directory entries buffer
     * @type {fs.Dirent[]}
     */
    entries = [];

    // Node opendir default=32
    batchSize = 32;

    /**
     * 
     * @param {URL} root 
     * @param {CrawlersCenter} center to deliver files and folder spawn request to
     * @param {number} batchSize 
     */
    constructor(root, center, batchSize) {
        this.center = center;
        this.root = root;
        this.relativePath = this.root.pathname.substr(this.center.root.pathname.length);


        this.batchSize = batchSize ? batchSize : this.batchSize;

        this.directoriesQueue.push(root);
        this.processDirectory()
            .finally(() => this.center.removeCrawler(this));
    }

    /**
     * 
     */
    async processDirectory() {
        do {
            try {
                let directoryUrl = this.directoriesQueue.pop();

                // console.log(`${this.constructor.name}[${this.relativePath}].processDirectory: open ${directoryUrl}`);
                this.directory = await fs.promises.opendir(directoryUrl, {
                    encoding: 'utf8',
                    bufferSize: this.batchSize
                });
                // console.log(`${this.constructor.name}[${this.relativePath}].processDirectory: start looping`);
                for await (const dirent of this.directory) {
                    if (this.entries.push(dirent) == this.batchSize) {
                        await this.processBatch();
                    }
                }
                await this.processBatch();
            } catch (processDirectoryError) {
                console.error(`${this.constructor.name}[${this.relativePath}].processDirectory: fail: ${processDirectoryError}`, processDirectoryError);
            }
        } while (this.directoriesQueue.length);
    }

    async processBatch() {
        // console.log(`${this.constructor.name}[${this.relativePath}].processBatch`);

        for (const entry of this.entries) {
            const entryUrl = url.pathToFileURL(this.directory.path + '\\' + entry.name);

            // console.log(`${this.constructor.name}[${this.relativePath}]: isFile=${entry.isFile()} isDirectory=${entry.isDirectory()}`, entry);
            if (entry.isFile()) {
                await this.center.addFile(entryUrl);
            } else if (entry.isDirectory()) {
                if (this.center.spawnFolder(entryUrl) == false) {
                    this.directoriesQueue.push(entryUrl);
                }
            } else {
                console.warn(`${this.constructor.name}[${this.relativePath}]@${entry.name}: handle entry type`, entry);
            }
        }
        this.entries.length = 0;
    }
}

module.exports = DirectoryCrawler;