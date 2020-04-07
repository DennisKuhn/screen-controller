const url = require('url');

const DirectoryCrawler = require('src/infrastructure/directorycrawler');

class CrawlersCenter {

  /** Initial root Url
   * @type {URL} */
  root;

  /** @type {string[]} */
  filesBuffer = [];

  /** @type {number} */
  maxCrawlers;

  /**
   * Active Crawlers
   * @type {DirectoryCrawler[]}
   */
  crawling = [];

  /**
   * @type {{ resolve: () => void, reject: (reason:string) => void, file: string }[]}
   */
  waitingCrawlers = [];


/**
 * @type {{ resolve: (file:string) => void, reject: (reason:string) => void }[]}
 */
  waitingConsumers = [];

  constructor(crawlerCount, bufferSize, batchSize) {
    this.maxCrawlers = crawlerCount;
    this.maxFiles = bufferSize;
    this.crawlerBatchSize = batchSize;
  }

  /**
   *
   * @param {string} rootDirectory
   */
  start(rootDirectory) {
    this.root = url.pathToFileURL(rootDirectory);

    // console.log(`${this.constructor.name}.start: ${rootDirectory} => ${this.root}`, this.root);

    this.spawnFolder(this.root);
  }

  /**
   *
   * @param {URL} folder
   * @returns {boolean} true if started a crawler for the folder. Returns false if all crawler slots are active at the moment
   */
  spawnFolder(folder) {
    // console.log(`${this.constructor.name}.spawnFolder @${this.crawling.length} =? ${this.maxCrawlers} ${folder}`)
    if (this.crawling.length == this.maxCrawlers) {
      return false;
    }
    this.crawling.push(new DirectoryCrawler(folder, this, this.crawlerBatchSize));

    return true;
  }

  /**
   * IF the last crawler has been removed, start again with spawnFolder(this.root)
   * @param {DirectoryCrawler} crawler
   */
  removeCrawler(crawler) {
    // console.log(`${this.constructor.name}.removeCrawler @${this.waitingNew.length} ${crawler.relativePath}`);
    const i = this.crawling.indexOf(crawler);
    // console.log(`${this.constructor.name}.removeCrawler found @${i} ${crawler.relativePath}`);
    this.crawling.splice(i, 1);

    if (this.crawling.length == 0) {
      console.log(`${this.constructor.name}.removeCrawler restarting at root`);
      this.spawnFolder(this.root);
    }
  }

  /**
   *
   * @param {string} file
   * @returns {Promise}
   */
  addFile(file) {
    // console.log(`${this.constructor.name}.addFile @${this.filesBuffer.length},${this.waitingConsumers.length} = ${file}`);
    return new Promise((resolve, reject) => {
      if (this.waitingConsumers.length) {
        // console.log(`${this.constructor.name}.addFile resolve waitingConsumer ${this.waitingConsumers.length} = ${file}`);
        const waitingConsumer = this.waitingConsumers.shift();
        waitingConsumer.resolve(file);
        resolve();
      } else {
        if (this.filesBuffer.length == this.maxFiles) {
          //console.log(`${this.constructor.name}.addFile add to waitingCrawlers @${this.waitingCrawlers.length} == ${this.maxFiles} = ${file}`);
          this.waitingCrawlers.push({ resolve: resolve, reject: reject, file: file });
        } else if (this.filesBuffer.length >= this.maxFiles) {
          console.error(`${this.constructor.name}.addFile add to waitingCrawlers @${this.waitingCrawlers.length} > ${this.maxFiles} = ${file}`);
          this.waitingCrawlers.push({ resolve: resolve, reject: reject, file: file });
        } else {
          //console.log(`${this.constructor.name}.addFile push filesBuffer, resolve @${this.filesBuffer.length} = ${file}`);
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
  getFile() {
    return new Promise((resolve, reject) => {
      // console.log(`${this.constructor.name}.getFile waiting=${this.waitingConsumers.length} buffer=${this.filesBuffer.length} waitingCrawlers=${this.waitingCrawlers.length}`);
      if (this.filesBuffer.length == 0) {
        // console.log(`${this.constructor.name}.getFile add to waitingConsumers @${this.waitingConsumers.length} @${this.filesBuffer.length} == 0`);
        this.waitingConsumers.push({ resolve: resolve, reject: reject });
      } else {
        const file = this.filesBuffer.shift();
        // console.log(`${this.constructor.name}.getFile sclice filesBuffer, resolve @${this.filesBuffer.length}, waitingCrawlers=${this.waitingCrawlers.length} = ${file}`);

        if (this.waitingCrawlers.length) {
          const crawler = this.waitingCrawlers.shift();
          this.filesBuffer.push(crawler.file);
          crawler.resolve();
        }

        resolve(file);
      }
    });
  }
}



module.exports = CrawlersCenter;
