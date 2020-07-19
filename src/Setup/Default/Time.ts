import { SetupBase } from '../SetupBase';
import { SetupBaseInterface } from '../SetupInterface';
import { Time as TimeInterface } from './TimeInterface';
import { JSONSchema7 } from 'json-schema';
import { observable } from 'mobx';
import { asScSchema7 } from '../ScSchema7';

export enum SunPositions {
    sunrise = 0, // sunrise (top edge of the sun appears on the horizon)
    sunriseEnd = 1, // sunrise ends(bottom edge of the sun touches the horizon)
    goldenHourEnd = 2, // morning golden hour(soft light, best time for photography) ends
    solarNoon = 3, // solar noon(sun is in the highest position)
    goldenHour = 4, // evening golden hour starts
    sunsetStart = 5, // sunset starts(bottom edge of the sun touches the horizon)
    sunset = 6, // sunset(sun disappears below the horizon, evening civil twilight starts)
    dusk = 7, // dusk(evening nautical twilight starts)
    nauticalDusk = 8, // nautical dusk(evening astronomical twilight starts)
    night = 9, // night starts(dark enough for astronomical observations)
    nadir = 10, // nadir(darkest moment of the night, sun is in the lowest position)
    nightEnd = 11, // night ends(morning astronomical twilight starts)
    nauticalDawn = 12, // nautical dawn(morning nautical twilight starts)
    dawn = 13, // dawn(morning nautical twilight ends, morning civil twilight starts)
}

// enum: [
//     'sunrise',
//     'sunriseEnd',
//     'goldenHourEnd',
//     'solarNoon',
//     'goldenHour',
//     'sunsetStart',
//     'sunset',
//     'dusk',
//     'nauticalDusk',
//     'night',
//     'nadir',
//     'nightEnd',
//     'nauticalDawn',
//     'dawn',
// ]

export class Time extends SetupBase implements TimeInterface {
    static readonly schema: JSONSchema7 = {
        $id: Time.name,
        allOf: [
            SetupBase.SCHEMA_REF,
            {
                type: 'object',
                properties: {
                    className: { const: Time.name },
                    name: asScSchema7({ scHidden: true }),
                    local: asScSchema7({ type: 'number', scViewOnly: true }),
                    second: asScSchema7({ type: 'number', scViewOnly: true }),
                    minute: asScSchema7({ type: 'number', scViewOnly: true }),
                    hour12: asScSchema7({ type: 'number', scViewOnly: true }),
                    hour24: asScSchema7({ type: 'number', scViewOnly: true }),
                    isAm: asScSchema7({ type: 'boolean', scViewOnly: true }),
                    dayOfTheWeek: asScSchema7({ type: 'number', scViewOnly: true }),
                    dayOfTheMonth: asScSchema7({ type: 'number', scViewOnly: true }),
                    month: asScSchema7({ type: 'number', scViewOnly: true }),
                    yearShort: asScSchema7({ type: 'number', scViewOnly: true }),
                    yearFull: asScSchema7({ type: 'number', scViewOnly: true }),
                    sunPosition: asScSchema7({ type: 'number', scViewOnly: true })
                },
                required: ['local', 'second', 'minute', 'hour12', 'hour24', 'isAm', 'dayOfTheWeek', 'dayOfTheMonth', 'month', 'yearShort', 'yearFull', 'sunPosition']
            }
        ]
    }
    
    @observable local: number;
    @observable second: number;
    @observable minute: number;
    @observable hour12: number;
    @observable hour24: number;
    @observable isAm: boolean;
    @observable dayOfTheWeek: number;
    @observable dayOfTheMonth: number;
    @observable month: number;
    @observable yearShort: number;
    @observable yearFull: number;
    @observable sunPosition: SunPositions;

    constructor(source: SetupBaseInterface) {
        super(source);

        this.local = source['local'];
        this.second = source['second'];
        this.minute = source['minute'];
        this.hour12 = source['hour12'];
        this.hour24 = source['hour24'];
        this.isAm = source['isAm'];
        this.dayOfTheWeek = source['dayOfTheWeek'];
        this.dayOfTheMonth = source['dayOfTheMonth'];
        this.month = source['month'];
        this.yearShort = source['yearShort'];
        this.yearFull = source['yearFull'];
        this.sunPosition = source['sunPosition'];
    }


    static register(): void {
        SetupBase.register(Time, Time.schema);
    }
}

Time.register();