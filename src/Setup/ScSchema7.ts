import { JSONSchema7 } from 'json-schema';

export interface ScSchema7 extends JSONSchema7 {
    scVolatile?: boolean;

    scViewOnly?: boolean;
    scHidden?: boolean;
    scTranslationId?: string;

    scFormat?: 'color';
}

export const asScSchema7 = (schema: ScSchema7): ScSchema7 => schema;