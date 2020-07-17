import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { SpeedDial, SpeedDialAction, SpeedDialIcon } from '@material-ui/lab';
import { RelativeRectangle } from '../../Setup/Default/RelativeRectangle';
import { OpenWith, ArrowUpward, ArrowDownward, ArrowForward, ArrowBack, AspectRatio, Height, } from '@material-ui/icons';
import { makeStyles, Theme, createStyles } from '@material-ui/core';

interface Props {
    rect: RelativeRectangle;
    moveNotSize: boolean;
    className: string;
}
const btnSize = 40;
const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            height: 380,
            transform: 'translateZ(0px)',
            flexGrow: 1,
        },
        speedDial: {
            position: 'absolute',
            bottom: 0,// theme.spacing(2),
            right: 0,//theme.spacing(2),
            height: btnSize,
        },
        speedDialContainer: {
            height: btnSize,
            width: btnSize,
            position: 'relative'
        },
        icon: {
            backgroundColor: 'transparent',
        }
    }),
);
const RectangleButton = observer(({ rect, moveNotSize, className }: Props): JSX.Element => {
    const [open, setOpen] = useState(false);
    const classes = useStyles();

    const handleOpen = (): void => setOpen(true);
    const handleClose = (): void => setOpen(false);
    let handleUpTaller: () => void;
    let handleDownShort: () => void;
    let handleLeftWider: () => void;
    let handleRightNarrow: () => void;

    if (moveNotSize) {
        handleUpTaller = (): number => rect.y = Number( (rect.y - 0.1).toFixed(10) );
        handleDownShort = (): number => rect.y = Number( (rect.y + 0.1).toFixed(10) );
        handleLeftWider = (): number => rect.x = Number( (rect.x - 0.1).toFixed(10) );
        handleRightNarrow = (): number => rect.x = Number( (rect.x + 0.1).toFixed(10) );
    } else {
        handleUpTaller = (): number => rect.height = Number( (rect.height + 0.1).toFixed(10) );
        handleDownShort = (): number => rect.height = Number( (rect.height - 0.1).toFixed(10) );
        handleLeftWider = (): number => rect.width = Number( (rect.width + 0.1).toFixed(10) );
        handleRightNarrow = (): number => rect.width = Number( (rect.width - 0.1).toFixed(10) );
    }

    return (
        <div className={className}>
            <div className={classes.speedDialContainer}>
                <SpeedDial
                    ariaLabel={moveNotSize ? 'Move' : 'Resize'}
                    open={open}
                    className={classes.speedDial}
                    hidden={false}
                    icon={<SpeedDialIcon
                        icon={moveNotSize ? <OpenWith className={classes.icon} color="action" /> : <AspectRatio className={classes.icon} color="action" />}
                        openIcon={moveNotSize ? <OpenWith className={classes.icon} color="action" /> : <AspectRatio className={classes.icon} color="action" />}
                    />}
                    onClose={handleClose}
                    onOpen={handleOpen}
                    direction="left"
                    FabProps={{ size: 'small', className: classes.icon }}
                >
                    <SpeedDialAction
                        key={rect.id + 'right'}
                        tooltipTitle={moveNotSize ? 'right' : 'narrow'}
                        icon={moveNotSize ? <ArrowForward /> : <Height fontSize="small" style={{ transform: 'rotate(90deg)' }} />}
                        onClick={handleRightNarrow}
                    />
                    <SpeedDialAction
                        key={rect.id + 'left'}
                        tooltipTitle={moveNotSize ? 'left' : 'wider'}
                        icon={moveNotSize ? <ArrowBack /> : <Height fontSize="large" style={{ transform: 'rotate(90deg)' }} />}
                        onClick={handleLeftWider}
                    />
                    <SpeedDialAction
                        key={rect.id + 'down'}
                        tooltipTitle={moveNotSize ? 'down' : 'shorter'}
                        icon={moveNotSize ? <ArrowDownward /> : <Height fontSize="small" />}
                        onClick={handleDownShort}
                    />
                    <SpeedDialAction
                        key={rect.id + 'up'}
                        tooltipTitle={moveNotSize ? 'up' : 'taller'}
                        icon={moveNotSize ? <ArrowUpward /> : <Height fontSize="large" />}
                        onClick={handleUpTaller}
                    />
                </SpeedDial>
            </div>
        </div>
    );
});

export default RectangleButton;