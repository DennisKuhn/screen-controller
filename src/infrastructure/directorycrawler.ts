import fs from 'fs';
import url, { URL } from 'url';

import CrawlersCenter from './crawlerscenter';


class DirectoryCrawler {

    center: CrawlersCenter;

    root: URL;

    relativePath: string;

    directory: fs.Dir;

    directoriesQueue: URL[] = [];

    /**
     * Directory entries buffer
     */
    entries: fs.Dirent[] = [];

    // Node opendir default=32
    batchSize = 32;

    /**
     *
     * @param {CrawlersCenter} center to deliver files and folder spawn request to
     * @param {number} batchSize
     */
    constructor( center: CrawlersCenter, batchSize: number) {
        this.center = center;

        this.batchSize = batchSize ? batchSize : this.batchSize;
    }

    /**
     *
     * @param {URL} root
     */
    run(root: URL) {

        this.root = root;
        this.relativePath = this.root.pathname.substr(this.center.root.pathname.length);

        this.directoriesQueue.push(root);
        this.processDirectory()
            .finally(() => this.center.removeCrawler(this));
    }

    /**
     *
     */
    async processDirectory(): Promise<void> {
        do {
            const directoryUrl = this.directoriesQueue.pop();
            try {
                // console.log(`${this.constructor.name}[${this.relativePath}].processDirectory: open ${directoryUrl}`);
                // eslint-disable-next-line
                //@ts-ignore
                this.directory = await fs.promises.opendir(directoryUrl, {
                    encoding: 'utf8',
                    bufferSize: this.batchSize
                });
            } catch (processDirectoryError) {
                console.error(`${this.constructor.name}[${this.relativePath}].processDirectory: opendir fail: ${processDirectoryError}`, processDirectoryError);

                if (this.root == directoryUrl) {
                    throw processDirectoryError;
                }
            }
            try {
                // console.log(`${this.constructor.name}[${this.relativePath}].processDirectory: start looping`);
                for await (const dirent of this.directory) {
                    if (this.entries.push(dirent) == this.batchSize) {
                        await this.processBatch();
                    }
                }
                await this.processBatch();
            } catch (processBatchError) {
                console.error(`${this.constructor.name}[${this.relativePath}].processDirectory: read dir fail: ${processBatchError}`, processBatchError);
            }
        } while (this.directoriesQueue.length);

        return;
    }

    async processBatch(): Promise<void> {
        // console.log(`${this.constructor.name}[${this.relativePath}].processBatch`);

        for (const entry of this.entries) {
            const entryUrl = url.pathToFileURL(this.directory.path + '\\' + entry.name);

            // console.log(`${this.constructor.name}[${this.relativePath}]: isFile=${entry.isFile()} isDirectory=${entry.isDirectory()}`, entry);
            if (entry.isFile()) {
                await this.center.addFile(entryUrl.href);
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

export default DirectoryCrawler;
