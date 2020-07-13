import { Box, Collapse, makeStyles, Icon, Typography, IconButton } from '@material-ui/core';
import { Settings, ExpandLess, ExpandMore } from '@material-ui/icons';
import React, { useState } from 'react';
import { callerAndfName } from '../../../../../utils/debugging';
import dashboardStyle from '../../../../assets/jss/material-dashboard-react/views/dashboardStyle';
import Card from '../../../../components/Card/Card';
import CardBody from '../../../../components/Card/CardBody';
import CardFooter from '../../../../components/Card/CardFooter';
import CardHeader from '../../../../components/Card/CardHeader';
import CardIcon from '../../../../components/Card/CardIcon';
import { ObjectPropsWithChildren } from '../../Shared';
import { SetupBase } from '../../../../../Setup/SetupBase';


const useCardStyles = makeStyles((/*theme*/) => (
    {
        ...dashboardStyle,
        childContainer: {
            display: 'flex',
            flexWrap: 'wrap',
        }
    }
));


const ObjectCard = (props: ObjectPropsWithChildren): JSX.Element => {
    if (!(props.item instanceof SetupBase)) throw new Error(`${callerAndfName()} props.item is not instanceof SetupBase`);
    const { schema } = props;
    const [open, setOpen] = useState(false);

    const setup = props.item;
    const classes = useCardStyles();
    const icon = schema.scIcon ? <Icon>{schema.scIcon}</Icon> : <Settings />;

    return (
        <Card>
            <CardHeader stats={true} icon={true}>
                <CardIcon color='primary' >
                    {icon}
                </CardIcon>
                <div className={classes.cardTitleContainer}>
                    <p className={classes.cardCategory}>{schema.$id}</p>
                    <h4 className={classes.cardTitle}>{setup.name}</h4>
                </div>
            </CardHeader>
            <CardBody>
                <IconButton aria-label="expand row" size="small" onClick={(): void => setOpen(!open)}>
                    {open ? <ExpandLess fontSize={'small'} /> : <ExpandMore fontSize={'small'} />}
                </IconButton>
                <Collapse in={open} timeout="auto" unmountOnExit>
                    <Box margin={1} className={classes.childContainer}>
                        {props.children}
                    </Box>
                </Collapse>
            </CardBody>
            <CardFooter stats={true} className={classes.displayFooter}>
                <Typography className={classes.displayFooter}>{props.helperText}</Typography>
            </CardFooter>
        </Card>
    );
};

export default ObjectCard;