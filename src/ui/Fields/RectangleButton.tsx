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
    let handleUp: () => void;
    let handleDown: () => void;
    let handleLeft: () => void;
    let handleRight: () => void;

    if (moveNotSize) {
        handleUp = (): number => rect.y -= 0.1;
        handleDown = (): number => rect.y += 0.1;
        handleLeft = (): number => rect.x -= 0.1;
        handleRight = (): number => rect.x += 0.1;
    } else {
        handleUp = (): number => rect.height -= 0.1;
        handleDown = (): number => rect.height += 0.1;
        handleLeft = (): number => rect.width -= 0.1;
        handleRight = (): number => rect.width += 0.1;
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
                        onClick={handleRight}
                    />
                    <SpeedDialAction
                        key={rect.id + 'left'}
                        tooltipTitle={moveNotSize ? 'left' : 'wider'}
                        icon={moveNotSize ? <ArrowBack /> : <Height fontSize="large" style={{ transform: 'rotate(90deg)' }} />}
                        onClick={handleLeft}
                    />
                    <SpeedDialAction
                        key={rect.id + 'down'}
                        tooltipTitle={moveNotSize ? 'down' : 'shorter'}
                        icon={moveNotSize ? <ArrowDownward /> : <Height fontSize="small" />}
                        onClick={handleDown}
                    />
                    <SpeedDialAction
                        key={rect.id + 'up'}
                        tooltipTitle={moveNotSize ? 'up' : 'taller'}
                        icon={moveNotSize ? <ArrowUpward /> : <Height fontSize="large" />}
                        onClick={handleUp}
                    />
                </SpeedDial>
            </div>
        </div>
    );
});

export default RectangleButton;