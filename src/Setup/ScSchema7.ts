import { JSONSchema7 } from 'json-schema';

export interface ScSchema7 extends JSONSchema7 {
    scVolatile?: boolean;

    scViewOnly?: boolean;
    scHidden?: boolean;
    scTranslationId?: string;
    scDescriptionTranslationId?: string;

    /** Name of the material icon */
    scIcon?: string;

    scFormat?: 'color' | 'password' | 'localFile' | 'localFolder';
    
    /** IDs of merged allOf schema */
    scAllOf?: string[];

    /** Original abstract schema before spreading into oneOF */
    scAbstract?: any; 

    scOneWith?: { $data: string };
}

export const asScSchema7 = (schema: ScSchema7): ScSchema7 => schema;