import { SetupItemInterface, SetupItem, Rectangle, RectangleInterface } from '../../infrastructure/Configuration/WallpaperSetup';

// export interface PluginSetupInterface extends SetupItemInterface {
//     relativeBounds: RectangleInterface;
//     scaledBounds: RectangleInterface | undefined;
// }

// export interface PluginSetupFactory {
//     (config: PluginSetupInterface): PluginSetupItem;
// }

// export abstract class PluginSetupItem extends SetupItem {
//     relativeBounds: Rectangle;
//     scaledBounds: Rectangle | undefined;

//     private static registra = new Map<string, { schema: any; factory: PluginSetupFactory }>();

//     protected static readonly schema = {
//         $schema: 'http://json-schema.org/draft/2019-09/schema#',
//         $id: 'https://github.com/DennisKuhn/screen-controller/schemas/PluginSchema.json',
//         definitions: {
//             Rectangle: {
//                 $id: '#Rectangle',
//                 type: 'object',
//                 properties: {
//                     x: { type: 'number' },
//                     y: { type: 'number' },
//                     width: { type: 'number' },
//                     height: { type: 'number' }
//                 },
//                 required: ['x', 'y', 'width', 'height']
//             },
//             SetupItem: {
//                 $id: '#SetupItem',
//                 type: 'object',
//                 properties: {
//                     id: {
//                         type: 'string'
//                     },
//                     parentId: {
//                         type: 'string'
//                     },
//                     className: {
//                         type: 'string'
//                     }
//                 },
//                 required: ['id', 'parentId', 'className']
//             },
//             PluginSetupItem: {
//                 $id: '#PluginSetupItem',
//                 allOff: [
//                     {
//                         $ref: '#SetupItem'
//                     },
//                     {
//                         properties: {
//                             relativeBounds: { $ref: '#Rectangle' },
//                             scaledBounds: { $ref: '#Rectangle' }
//                         },
//                         required: ['relativeBounds', 'scaledBounds']
//                     }
//                 ]
//             }
//         }
//     };

//     public static register(className: string, schema: any, factory: PluginSetupFactory): void {
//         console.log(`PluginManager.register ${className}`);

//         PluginSetupItem.registra.set( className, { schema, factory } );
//     }

//     public static get schemas(): any[] {
//         const response = new Array<any>();
//         PluginSetupItem.registra.forEach(({ schema }) => response.push(schema));
        
//         return response;
//     }

//     public static create(source: PluginSetupInterface): PluginSetupItem {
//         const plugin = this.registra.get(source.className);

//         if (!plugin) throw new Error(`PluginSetupItem.create(${source.className}) nothing registered`);

//         return plugin.factory(source);
//     }

//     constructor(setup: PluginSetupInterface) {
//         super(setup);

//         this.relativeBounds = new Rectangle(setup.relativeBounds);

//         if (setup.scaledBounds) {
//             this.scaledBounds = new Rectangle(setup.scaledBounds);
//         }
//     }

//     get shallow(): PluginSetupInterface {
//         return {
//             ...super.shallow,
//             relativeBounds: this.relativeBounds.shallow,
//             scaledBounds: this.scaledBounds?.shallow
//         };
//     }

//     get deep(): PluginSetupInterface {
//         return {
//             ...super.deep,
//             relativeBounds: this.relativeBounds.shallow,
//             scaledBounds: this.scaledBounds?.shallow
//         };
//     }
// }
