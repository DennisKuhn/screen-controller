import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { SpeedDial, SpeedDialAction, SpeedDialIcon } from '@material-ui/lab';
import { RelativeRectangle } from '../../../Setup/Default/RelativeRectangle';
import { OpenWith, ArrowUpward, ArrowDownward, ArrowForward, ArrowBack,  } from '@material-ui/icons';
import { makeStyles, Theme, createStyles } from '@material-ui/core';

interface Props {
    rect: RelativeRectangle;
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
        }

    }),
);
const MoveRectangleButton = observer(({ rect }: Props): JSX.Element => {
    const [open, setOpen] = useState(false);
    const classes = useStyles();

    const handleOpen = (): void => setOpen(true);
    const handleClose = (): void => setOpen(false);
    const handleUp = (): number => rect.y -= 0.1;
    const handleDown = (): number => rect.y += 0.1;
    const handleLeft = (): number => rect.x -= 0.1;
    const handleRight = (): number => rect.x += 0.1;
    return (
        <div className={classes.speedDialContainer}>
            <SpeedDial
                ariaLabel="Move"
                open={open}
                className={classes.speedDial}
                hidden={false}
                icon={<SpeedDialIcon icon={<OpenWith />} />}
                onClose={handleClose}
                onOpen={handleOpen}
                direction="left"
                FabProps={{ size: 'small' }}
            >
                <SpeedDialAction
                    key={rect.id + 'right'}
                    tooltipTitle={'right'}
                    icon={<ArrowForward />}
                    onClick={handleRight}
                />
                <SpeedDialAction
                    key={rect.id + 'left'}
                    tooltipTitle={'left'}
                    icon={<ArrowBack />}
                    onClick={handleLeft}
                />
                <SpeedDialAction
                    key={rect.id + 'down'}
                    tooltipTitle={'down'}
                    icon={<ArrowDownward />}
                    onClick={handleDown}
                />
                <SpeedDialAction
                    key={rect.id + 'up'}
                    tooltipTitle={'up'}
                    icon={<ArrowUpward />}
                    onClick={handleUp}
                />
            </SpeedDial>
        </div>
    );
});

export default MoveRectangleButton;