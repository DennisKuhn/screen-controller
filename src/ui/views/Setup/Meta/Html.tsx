import React from 'react';
import register, { Props, ObjectProps } from '../Registry';

const TableAndBody = (props: ObjectProps): JSX.Element => <table><tbody>{props.children}</tbody></table>;

register.register('Object', undefined, TableAndBody, Props.None);
register.register('Array', undefined, null);
register.register('Map', undefined, null);
register.register('Field', undefined, 'tr', Props.None);
register.register('LabelContainer', undefined, 'th', Props.None);
register.register('LabelView', undefined, 'label', Props.View);
register.register('ValueContainer', undefined, 'td', Props.None);
register.register('ValueInput', 'array', null);
register.register('ValueInput', 'map', null);
register.register('ValueInput', undefined, 'input' , Props.Input);
