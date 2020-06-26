import { setInterval, clearInterval } from 'timers';
import { autorun, IReactionDisposer } from 'mobx';
import suncalc from 'suncalc';
import { Screen } from '../Setup/Application/Screen';
import controller from '../Setup/Controller/Factory';
import { Time } from '../Setup/Default/Time';
import { SunPositions, Time as TimeInterface } from '../Setup/Default/TimeInterface';
import { SetupBase } from '../Setup/SetupBase';
import { callerAndfName } from '../utils/debugging';
import { create } from '../Setup/SetupFactory';


let sunTimes: [string, Date][] | undefined;

const H24_12 = (h: number): number => h < 13 ? h : h - 12;

const update = (screen: Screen): void => {
    if ((screen.longitude == undefined) || (screen.longitude == undefined)) {
        console.error(`${callerAndfName()}: no location`);
        return;
    }
    if (sunTimes == undefined) throw new Error(`${callerAndfName()} no sunTimes`);

    const time = screen.time ?? SetupBase.createNewInterface(Time.name, screen.id, 'time') as TimeInterface;

    const now = new Date();
    const nowValue = now.valueOf();

    const positionEntry = sunTimes
        .filter(([, time]) => time.valueOf() < nowValue)
        // .sort(([, a], [, b]) => a.valueOf() - b.valueOf())
        .pop();

    if (positionEntry == undefined) {
        console.error(`Can't find a sunPosition ${now.toISOString()}=${nowValue} in`, sunTimes);
        return;
    }
    const position: SunPositions = SunPositions[positionEntry[0]];
    
    (time.local != now.valueOf()) && (time.local = now.valueOf());
    (time.second != now.getSeconds()) && (time.second = now.getSeconds());
    (time.minute != now.getMinutes()) && (time.minute = now.getMinutes());
    (time.hour12 != H24_12(now.getHours())) && (time.hour12 = H24_12(now.getHours()));
    (time.isAm != now.getHours() < 12) && (time.isAm = now.getHours() < 12);
    (time.hour24 != now.getHours()) && (time.hour24 = now.getHours());
    (time.dayOfTheWeek != now.getDay()) && (time.dayOfTheWeek = now.getDay());
    (time.dayOfTheMonth != now.getDate()) && (time.dayOfTheMonth = now.getDate());
    (time.month != now.getMonth()) && (time.month = now.getMonth());
    (time.yearShort != now.getFullYear() % 100) && (time.yearShort = now.getFullYear() % 100);
    (time.yearFull != now.getFullYear()) && (time.yearFull = now.getFullYear());
    (time.sunPosition != position) && (time.sunPosition = position);

    if (screen.time == undefined) {
        console.debug(`${callerAndfName()}: Create time ${positionEntry[0]}`, time);
        screen.time = create(time) as Time;
    } else {
    //         console.debug(
    //             `${callerAndfName()}: Update time ${positionEntry[0]} ` +
    //             `${time.hour24.toLocaleString(undefined, { minimumIntegerDigits: 2 })}:` +
    //             `${time.minute.toLocaleString(undefined, { minimumIntegerDigits: 2 })}:` +
    //             `${time.second.toLocaleString(undefined, { minimumIntegerDigits: 2 })} ${time.local}`
    // //            , toJS(time, { recurseEverything: true })
    //         );
    }
    
};

let interval: NodeJS.Timeout | undefined;
let autoRunDisposer: IReactionDisposer | undefined;

const start = async (): Promise<void> => {
    const screen = (await controller.getSetup(Screen.name, 0)) as Screen;

    const observeLocation = (): void => {
        if ((screen.latitude == undefined) || (screen.longitude == undefined)) {
            console.debug(`${callerAndfName()} no location`);
            return;
        }

        sunTimes = Object.entries( suncalc.getTimes(new Date(), screen.latitude, screen.longitude) )
            .sort(([, a], [, b]) => a.valueOf() - b.valueOf());

        console.debug(`${callerAndfName()} ${interval !== undefined ? 'clearInterval(' + interval + ')' : ''} ${(new Date())}`, {...sunTimes});

        if (interval !== undefined) {
            clearInterval(interval);
        }
        interval = setInterval(
            update,
            1000,
            screen
        );
    };

    autoRunDisposer = autorun(observeLocation);
};

export const stop = (): void => {
    interval && clearInterval(interval);
    interval = undefined;
    autoRunDisposer && autoRunDisposer();
    autoRunDisposer = undefined;
};

export default start;
