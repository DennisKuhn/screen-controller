import {
    successColor,
    warningColor,
    dangerColor,
    whiteColor,
    grayColor,
    hexToRgb
} from '../../material-dashboard-react';
import { createStyles } from '@material-ui/core';

const dashboardStyle = createStyles({
    successText: {
        color: successColor[0]
    },
    warningText: {
        color: warningColor[0]
    },
    dangerText: {
        color: dangerColor[0]
    },
    upArrowCardCategory: {
        width: '16px',
        height: '16px'
    },
    stats: {
        color: grayColor[0],
        display: 'inline-flex',
        fontSize: '12px',
        lineHeight: '22px',
        '& svg': {
            top: '4px',
            width: '16px',
            height: '16px',
            position: 'relative',
            marginRight: '3px',
            marginLeft: '3px'
        },
        '& .fab,& .fas,& .far,& .fal,& .material-icons': {
            top: '4px',
            fontSize: '16px',
            position: 'relative',
            marginRight: '3px',
            marginLeft: '3px'
        }
    },
    cardCategory: {
        color: grayColor[0],
        margin: '0',
        fontSize: '14px',
        marginTop: '0',
        paddingTop: '10px',
        marginBottom: '0'
    },
    cardCategoryWhite: {
        color: 'rgba(' + hexToRgb(whiteColor) + ',.62)',
        margin: '0',
        fontSize: '14px',
        marginTop: '0',
        marginBottom: '0'
    },
    cardTitle: {
        color: grayColor[2],
        marginTop: '0px',
        minHeight: 'auto',
        fontWeight: 300,
        fontFamily: '\'Roboto\', \'Helvetica\', \'Arial\', sans-serif',
        marginBottom: '3px',
        textDecoration: 'none',
        '& small': {
            color: grayColor[1],
            fontWeight: 400,
            lineHeight: 1
        }
    },
    cardTitleWhite: {
        color: whiteColor,
        marginTop: '0px',
        minHeight: 'auto',
        fontWeight: 300,
        fontFamily: '\'Roboto\', \'Helvetica\', \'Arial\', sans-serif',
        marginBottom: '3px',
        textDecoration: 'none',
        '& small': {
            color: grayColor[1],
            fontWeight: 400,
            lineHeight: 1
        }
    },
    cardBody: {
        display: 'inline-flex',
        alignItems: 'center'
    },
    displayFooter: {
        // display: 'flex',
        color: grayColor[0],
        display: 'inline-flex',
        fontSize: '12px',
        lineHeight: '22px',
        '& svg': {
            top: '4px',
            width: '16px',
            height: '16px',
            position: 'relative',
            marginRight: '3px',
            marginLeft: '3px'
        },
        '& .fab,& .fas,& .far,& .fal,& .material-icons': {
            top: '4px',
            fontSize: '16px',
            position: 'relative',
            marginRight: '3px',
            marginLeft: '3px'
        }
    },
    displayFooterCpuGood: {
        whiteSpace: 'nowrap',
        color: successColor[0],
    },
    displayFooterCpuWarning: {
        whiteSpace: 'nowrap',
        color: warningColor[0],
    },
    displayFooterCpuDanger: {
        whiteSpace: 'nowrap',
        color: dangerColor[0],
    },
    displayFooterResolution: {
        textAlign: 'end'
    },
    browserLabel: {
        display: 'flex',
        alignItems: 'baseline'
    },
    browserName: {
        width: '100px'
    }
});

export default dashboardStyle;
