import { createMuiTheme, Theme, StyleRules } from '@material-ui/core/styles';
import { CSSProperties } from 'react';

// export interface ExxCssProperties extends CSSProperties {
//     [index: string]: any;
// }

type ExxCssProperties = StyleRules<keyof CSSProperties>;

export interface ExtendedTheme extends Theme {
    getInputWidth: () => number;
    columnDefaults: StyleRules<'defaultField' | 'defaultFieldContainer' | 'largeField' | 'largeFieldContainer' | 'largeGrowableField' | 'largeGrowableFieldContainer' >;
}

let inputWidthCache: undefined | number;


const theme = createMuiTheme({}) as ExtendedTheme;

/** Get the width of a standard browser input control */
theme.getInputWidth = (): number => {
    if (inputWidthCache === undefined) {
        const input = document.createElement('input');
        window.document.body.append(input);
        inputWidthCache = input.getBoundingClientRect().width / 2;
        window.document.body.removeChild(input);
    }
    return inputWidthCache;
};


theme.columnDefaults = {
    defaultField: {    
        minWidth: 12,
        width: (theme.getInputWidth()),
    },
    defaultFieldContainer: {
        width: (theme.getInputWidth() + 2 * theme.spacing(1) + 30),
        marginBottom: theme.spacing(2),
        padding: '0 15px !important',
    },
    largeField: {
        width: theme.getInputWidth() * 2,
    },
    largeFieldContainer: {
        width: theme.getInputWidth() * 2 + 3 * theme.spacing(1) + 30,
        marginBottom: theme.spacing(2),
        padding: '0 15px !important',
    },
    largeGrowableField: {
        minWidth: theme.getInputWidth(),
    },
    largeGrowableFieldContainer: {
        minWidth: theme.getInputWidth() * 2 + 3 * theme.spacing(1) + 30,
        marginBottom: theme.spacing(2),
        padding: '0 15px !important',
    },
};

export default theme;