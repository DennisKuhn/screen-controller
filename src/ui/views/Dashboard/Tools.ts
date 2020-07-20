export const getCpuUsage = (value: number | undefined): number => (value ?? 0) * 100;
export const getTicksText = (ticks: number | undefined): string => ticks === undefined ? '?' : ticks.toFixed(ticks < 10 ? 1 : 0);
export const getCpuText = (cpuUsage: number): string => cpuUsage.toFixed(cpuUsage < 10 ? 1 : 0);
export const getCpuClass = (cpuUsage: number): string => cpuUsage < 5 ? 'successText' : cpuUsage < 10 ? 'warningText' : 'dangerText';
