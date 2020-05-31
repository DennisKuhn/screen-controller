import { Rectangle } from './Rectangle';
import { SetupBase } from '../SetupBase';
import { JSONSchema7 } from 'json-schema';
import { SetupItemId, SetupBaseInterface } from '../SetupInterface';
import { SimpleRectangle } from './RectangleInterface';

export class RelativeRectangle extends Rectangle {
    static readonly schema: JSONSchema7 = {
        $id: RelativeRectangle.name,
        allOf: [
            Rectangle.SCHEMA_REF,
            {
                properties: {
                    className: { const: RelativeRectangle.name },
                    x: { type: 'number', minimum: 0, maximum: 1, multipleOf: 0.005 },
                    y: { type: 'number', minimum: 0, maximum: 1, multipleOf: 0.005 },
                    width: { type: 'number', minimum: 0, maximum: 1, multipleOf: 0.005 },
                    height: { type: 'number', minimum: 0, maximum: 1, multipleOf: 0.005 }
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
        SetupBase.register(RelativeRectangle, RelativeRectangle.schema);
    }
}

RelativeRectangle.register();