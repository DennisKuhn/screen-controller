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

    terminating= false;

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
    async run(root: URL): Promise<void> {

        this.root = root;
        this.relativePath = this.root.pathname.substr(this.center.root.pathname.length);

        this.directoriesQueue.push(root);
        
        await this.processDirectory();
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
            if (this.terminating) {
                return;
            }
            try {
                // console.log(`${this.constructor.name}[${this.relativePath}].processDirectory: start looping`);
                for await (const dirent of this.directory) {
                    if (this.terminating) {
                        return;
                    }
                    if (this.entries.push(dirent) == this.batchSize) {
                        await this.processBatch();
                        if (this.terminating) {
                            return;
                        }
                    }
                }
                await this.processBatch();
            } catch (processBatchError) {
                console.error(
                    `${this.constructor.name}[${this.relativePath}].processDirectory: read dir fail:[q=${this.directoriesQueue.length},t=${this.terminating}]`,
                    processBatchError);
            }
        } while (this.directoriesQueue.length && (this.terminating == false));

        return;
    }

    async processBatch(): Promise<void> {
        // console.log(`${this.constructor.name}[${this.relativePath}].processBatch`);

        for (const entry of this.entries) {
            const entryUrl = url.pathToFileURL(this.directory.path + '\\' + entry.name);

            if (this.terminating) {
                return;
            }
            // console.log(`${this.constructor.name}[${this.relativePath}]: isFile=${entry.isFile()} isDirectory=${entry.isDirectory()}`, entry);
            if (entry.isFile()) {
                await this.center.addFile(entryUrl.href);
            } else if (entry.isDirectory()) {

                if ( this.center.canSpan ) {
                    this.center.spawnFolder(entryUrl)
                        .catch(reason => {
                            console.warn(`${this.constructor}[${this.relativePath}]@${entry.name}:.processBatch: spawnFolder threw: ${reason}`, reason);
                        });
                } else {
                    this.directoriesQueue.push(entryUrl);
                }
            } else {
                console.warn(`${this.constructor.name}[${this.relativePath}]@${entry.name}: handle entry type`, entry);
            }
        }
        this.entries.length = 0;
    }

    terminate(): void {
        this.terminating = true;
        this.directoriesQueue.length = 0;
    }
}

export default DirectoryCrawler;
