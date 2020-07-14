import React from 'react';
import { ObjectPropsWithChildren } from '../PropTypes';
import registry from '../Registry';

const TableAndBody = (props: ObjectPropsWithChildren): JSX.Element => <table><tbody>{props.children}</tbody></table>;

registry.register('Root', undefined, null);
registry.register('Object', undefined, TableAndBody, ['None']);
registry.register('Array', undefined, TableAndBody, ['None']);
registry.register('Map', undefined, TableAndBody, ['None']);

registry.register('Field', undefined, 'tr', ['None']);
registry.register('LabelContainer', undefined, 'th', ['None']);
registry.register('LabelView', undefined, 'label', ['View']);
registry.register('ValueContainer', undefined, 'td', ['None']);
registry.register('ValueInput', undefined, 'input', ['Input']);
