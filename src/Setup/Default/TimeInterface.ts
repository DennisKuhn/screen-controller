import { SetupBaseInterface } from '../SetupInterface';

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

export interface Time extends SetupBaseInterface {
    second: number;
    minute: number;
    hour12: number;
    hour24: number;
    isAm: boolean;
    dayOfTheWeek: number;
    dayOfTheMonth: number;
    month: number;
    yearShort: number;
    yearFull: number;
    sunPosition: SunPositions;
}
