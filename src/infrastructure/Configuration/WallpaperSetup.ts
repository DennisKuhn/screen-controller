import Url from '../../utils/Url';
import { Dictionary } from 'lodash';

export interface IdMap < T > {
    [key: number]: T;
}

export interface Setup extends Dictionary<IdMap<Display>> {
    displays: IdMap<Display>;
}

export interface Wallpaper {
    file: Url;
    config?: Config;
}

/**
 * Bounds in %, relativ to display. Application unique id, e.g. auto increment from 1
 * @example {x:0, y:0, width:1, height:1} fills the entire display
 **/
export interface Browser {
    /** Application unique, e.g. auto increment from 1 */
    id: number;
    x: number;
    y: number;
    width: number;
    height: number;
    paper: Wallpaper;
}

/**
 * Display width and height (Device Pixels divided by scaling factor)
 */
export interface Display {
    id: number;
    browsers: IdMap<Browser>;
    x: number;
    y: number;
    width: number;
    height: number;
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

