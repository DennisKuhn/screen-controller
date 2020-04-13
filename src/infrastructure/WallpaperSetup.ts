import Url from '../utils/Url';

export interface Wallpaper {
    /** Relativ bounds of the browser in the display */
    browser: Browser;
    file: Url;
    display: Display;
    config: Config;
}

/**
 * Bounds in %, relativ to display
 * @example {x:0, y:0, width:1, height:1} fills the entire display
 **/
export interface Browser {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Display width and height (Device Pixels divided by scaling factor)
 */
export interface Display {
    id: number;
}


export interface Config {
    contentrating: string;
    description: string;
    file: string;
    preview: string;
    title: string;
    type: string;
    visibility: string;
    tags: string[];
    general: {
        supportsaudioprocessing: boolean;
        properties: Properties;
    };
}

export interface Properties {
    [key: string]: Property;

}

export interface Option {
    label: string;
    value: string;
}

export interface Property {
    condition: string;
    order: number;
    text: string;
    type: string;
    max: number;
    min: number;
    value: string;
    options: Option[];
}

