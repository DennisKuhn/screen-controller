import React from 'react';
import { SimpleRectangle } from '../../Setup/Default/RectangleInterface';
import { PercentField } from './PercentField';
import { observer } from 'mobx-react-lite';


const RelativeRectangle = observer( ({ rect, onChange }: { rect: SimpleRectangle; onChange?}): JSX.Element => (<>
    <PercentField
        value={rect.x}
        label='x'
        onChange={(event: React.ChangeEvent<HTMLInputElement>): void => {
            rect.x = Number(event.target.value);
            onChange && onChange({ ...event, target: { ...event.target, value: rect } });
            }}
    />
    <span>,</span>
    <PercentField
        value={rect.y}
        label='y'
        onChange={(event: React.ChangeEvent<HTMLInputElement>): void => {
            rect.y = Number(event.target.value);
            onChange && onChange({ ...event, target: { ...event.target, value: rect } });
        }}
    />
    <span>&nbsp;</span>
    <PercentField
        value={rect.width}
        label='width'
        onChange={(event: React.ChangeEvent<HTMLInputElement>): void => {
            rect.width = Number(event.target.value);
            onChange && onChange({ ...event, target: { ...event.target, value: rect } });
        }}
    />
    <span>*</span>
    <PercentField
        value={rect.height}
        label='height'
        onChange={(event: React.ChangeEvent<HTMLInputElement>): void => {
            rect.height = Number(event.target.value);
            onChange && onChange({ ...event, target: { ...event.target, value: rect } });
        }}
    />
</>
));

export default RelativeRectangle;