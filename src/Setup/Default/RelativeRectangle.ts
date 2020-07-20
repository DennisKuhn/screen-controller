import { Rectangle } from './Rectangle';
import { SetupBase } from '../SetupBase';
import { JSONSchema7 } from 'json-schema';
import { PropertyKey, SetupItemId, SetupBaseInterface } from '../SetupInterface';
import { SimpleRectangle } from './RectangleInterface';
import { asScSchema7 } from '../ScSchema7';

export class RelativeRectangle extends Rectangle {
    public static readonly SCHEMA_REF = { $ref: RelativeRectangle.name };

    static readonly schema: JSONSchema7 = {
        $id: RelativeRectangle.name,
        allOf: [
            SetupBase.SCHEMA_REF,
            {
                type: 'object',
                properties: {
                    className: { const: RelativeRectangle.name },
                    name: asScSchema7({ scHidden: true }),
                    x: { allOf: [SetupBase.PERCENT_REF, asScSchema7({ default: 0, scOneWith: { $data: '1/width'} })] },
                    y: { allOf: [SetupBase.PERCENT_REF, asScSchema7({ default: 0, scOneWith: { $data: '1/height' } })] },
                    width: { allOf: [SetupBase.PERCENT_REF, asScSchema7({ default: 1, scOneWith: { $data: '1/x' } })] },
                    height: { allOf: [SetupBase.PERCENT_REF, asScSchema7({ default: 1, scOneWith: { $data: '1/y' } })] }
                },
                required: ['x', 'y', 'width', 'height']
            }
        ]
    }

    static newInterface = (parentId: SetupItemId, parentProperty: PropertyKey, source: SimpleRectangle): SetupBaseInterface =>
        ({
            ...SetupBase.createNewInterface(RelativeRectangle.name, parentId, parentProperty),
            ...source
        });


    static register(): void {
        SetupBase.register(RelativeRectangle, RelativeRectangle.schema);
    }
}

RelativeRectangle.register();