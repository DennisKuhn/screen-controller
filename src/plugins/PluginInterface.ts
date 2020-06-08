import { JSONSchema7 } from 'json-schema';
import React from 'react';
import { PluginInterface as PluginSetup } from '../Setup/Application/PluginInterface';

//export const PLUGIN_SCHEMA_REF = { $ref: '#/definitions/Plugin' };
export const PLUGIN_SCHEMA_REF = { $ref: 'Plugin' };

export interface Plugin {
}

export interface RenderPlugin extends Plugin {
    render: (gradient: any) => void;
}

export interface IntervalPlugin extends RenderPlugin {
    renderInterval: number;
}

export type ElementType = HTMLDivElement | HTMLCanvasElement;

export interface PluginConstructor {
    new(config: PluginSetup): Plugin;
}

export interface CanvasPluginContructor extends PluginConstructor {
    new(config: PluginSetup, root: HTMLCanvasElement): Plugin;
}

export interface HTMLPluginContructor extends PluginConstructor {
    new(config: PluginSetup, root: HTMLDivElement): Plugin;
}

export type ReactRenderer = (props: { config: PluginSetup }) => JSX.Element;

/**
 * Used by plug in to register
 */
export interface RegistrationBase {
    schema: JSONSchema7;
}

export interface ReactRegistration extends RegistrationBase {
    factory?: PluginConstructor;
    render: ReactRenderer;
}

export interface CanvasRegistration extends RegistrationBase {
    canvasFactory: { new(config: PluginSetup, root: HTMLCanvasElement): Plugin };
    // canvasFactory: CanvasPluginContructor;
}

export interface HtmlRegistration extends RegistrationBase {
    htmlFactory: { new(config: PluginSetup, root: HTMLDivElement): Plugin };
    // htmlFactory: HTMLPluginContructor;
}

export interface PlainRegistration extends RegistrationBase {
    factory: PluginConstructor;
}

export type Registration = RegistrationBase | CanvasRegistration | HtmlRegistration | PlainRegistration | ReactRegistration;
