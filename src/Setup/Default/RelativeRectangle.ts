import { Rectangle } from './Rectangle';
import { SetupBase } from '../SetupBase';
import { JSONSchema7 } from 'json-schema';
import { SetupItemId, SetupBaseInterface } from '../SetupInterface';
import { SimpleRectangle } from './RectangleInterface';

export class RelativeRectangle extends Rectangle {
    public static readonly SCHEMA_REF = { $ref: RelativeRectangle.name };

    static readonly schema: JSONSchema7 = {
        $id: RelativeRectangle.name,
        allOf: [
            Rectangle.SCHEMA_REF,
            {
                properties: {
                    className: { const: RelativeRectangle.name },
                    x: SetupBase.PERCENT_REF,
                    y: SetupBase.PERCENT_REF,
                    width: SetupBase.PERCENT_REF,
                    height: SetupBase.PERCENT_REF
                },
                required: ['x', 'y', 'width', 'height']
            }
        ]
    }

    static newInterface = (parentId: SetupItemId, source: SimpleRectangle): SetupBaseInterface =>
        ({
            ...SetupBase.createNewInterface(RelativeRectangle.name, parentId),
            ...source
        });

    static createNew = (parentId: SetupItemId, source: SimpleRectangle): RelativeRectangle =>
        new RelativeRectangle(
            RelativeRectangle.newInterface(parentId, source));

    static register(): void {
        SetupBase.register(RelativeRectangle, RelativeRectangle.schema, Rectangle.uiSchema);
    }
}

RelativeRectangle.register();