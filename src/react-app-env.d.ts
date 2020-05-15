/// <reference types="react-scripts" />

declare module 'require-glob';

interface PluginLoader {
    Setup(): void;
    name: string;
}