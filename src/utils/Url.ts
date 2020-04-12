import url, { Url } from 'url';

const URL2Url = (URLObject: url.URL): Url => {
    return {
        auth: null,
        path: null,
        slashes: null,
        query: null,
        hash: URLObject.hash,
        host: URLObject.host,
        hostname: URLObject.hostname,
        href: URLObject.href,
        pathname: URLObject.pathname,
        protocol: URLObject.protocol,
        search: URLObject.search,
        port: URLObject.port
    };
};

export const fs2Url = (link: string): Url => {
    return URL2Url(url.pathToFileURL(link));
};

export const url2fs = (localUrl: Url): string => {
    return url.fileURLToPath(localUrl.href);
};

export const href2Url = (href: string): Url => {
    return url.parse(href, false, false);
};

export const href2fs = (href: string): string => {
    return url2fs(href2Url(href));
};

export default Url;