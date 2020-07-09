import React from 'react';
import register, { ObjectPropsWithChildren } from '../Registry';

const TableAndBody = (props: ObjectPropsWithChildren): JSX.Element => <table><tbody>{props.children}</tbody></table>;

register.register('Object', undefined, TableAndBody, ['None']);
register.register('Array', undefined, TableAndBody, ['None']);
register.register('Map', undefined, TableAndBody, ['None']);

register.register('Field', undefined, 'tr', ['None']);
register.register('LabelContainer', undefined, 'th', ['None']);
register.register('LabelView', undefined, 'label', ['View']);
register.register('ValueContainer', undefined, 'td', ['None']);
register.register('ValueInput', undefined, 'input', ['Input']);
