import { SetupBaseInterface } from '../SetupInterface';

export interface Gradient extends SetupBaseInterface {
    type: 'Solid' | 'Circular' | 'Horizontal' | 'Vertical';
    colors: string[];
}