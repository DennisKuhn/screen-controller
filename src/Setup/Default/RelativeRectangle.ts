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
                    x: { allOf: [SetupBase.PERCENT_REF, { default: 0 }] },
                    y: { allOf: [SetupBase.PERCENT_REF, { default: 0 }] },
                    width: { allOf: [SetupBase.PERCENT_REF, { default: 1 }] },
                    height: { allOf: [SetupBase.PERCENT_REF, { default: 1 }] }
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

    static create = (parentId: SetupItemId, parentProperty: PropertyKey, source: SimpleRectangle): RelativeRectangle =>
        new RelativeRectangle(
            RelativeRectangle.newInterface(parentId, parentProperty, source));

    static register(): void {
        SetupBase.register(RelativeRectangle, RelativeRectangle.schema, Rectangle.uiSchema);
    }
}

RelativeRectangle.register();