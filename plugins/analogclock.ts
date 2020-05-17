import { PluginInterface as PluginSetup } from '../src/Setup/Application/PluginInterface';
import { Registration, PluginInterface } from '../src/plugins/PluginInterface';
import { JSONSchema7 } from 'json-schema';

interface Setup extends PluginSetup {
    showSeconds: boolean;
    showMarkers: boolean;
}

/**
 * Displays an analog clock, optional markers and seconds hand.
 */
export class AnalogClock implements PluginInterface {

    static readonly schema: JSONSchema7 = {
        $id: '#' + 'AnalogClock',
        title: 'Analog clock',
        description: 'Analog clock with optional seconds hand or markers',
        allOf: [
            {
                $ref: '#' + Plugin.name
            },
            {
                properties: {
                    showSeconds: { type: 'boolean' },
                    showMarkers: { type: 'boolean' }
                },
                required: ['showSeconds', 'showMarkers']
            }
        ]
    };

    private _active = false;

    get active(): boolean {
        return this._active;
    }

    set active(newActive: boolean) {
        this._active = newActive;
    }

    private context: CanvasRenderingContext2D;

    visible = true;

    setup: Setup;

    constructor(setup: PluginSetup, root: HTMLCanvasElement) {        
        this.setup = setup as Setup;

        const context = root.getContext('2d');

        if (!context)
            throw new Error(`${this.constructor.name}/${setup.className}[${setup.id}]@${setup.parentId} can't get context from ${root}`);

        this.context = context;
    }

    /**
     * @returns {boolean}
     */
    get Visible(): boolean {
        return this.visible;
    }
    set Visible(visible) {
        this.visible = visible;
    }

    render(gradient): void {
        if (!this.setup.scaledBounds) throw new Error(`${this.constructor.name}.render: no scaledBounds`);

        if (this.visible) {
            const w2 = this.setup.scaledBounds.width / 2;//0;
            const h2 = this.setup.scaledBounds.height / 2;//0;
            const baseRadius = Math.min(this.setup.scaledBounds.width, this.setup.scaledBounds.height) / 3;
            const dt = new Date();
            let hour = -Math.PI * 2 * (dt.getHours() % 12) / 12;
            let m = -Math.PI * 2 * dt.getMinutes() / 60;
            const s = -Math.PI * 2 * dt.getSeconds() / 60;

            m += s / 60;
            hour += m / 12;
            this.context.fillStyle = gradient;
            this.context.strokeStyle = gradient;

            this.context.lineWidth = 8;
            this.context.beginPath();
            this.context.moveTo(w2, h2);
            this.context.lineTo(w2 + Math.sin(hour + Math.PI) * baseRadius / 2, h2 + Math.cos(hour + Math.PI) * baseRadius / 2);
            this.context.stroke();
            this.context.lineWidth = 4;
            this.context.beginPath();
            this.context.moveTo(w2, h2);
            this.context.lineTo(w2 + Math.sin(m + Math.PI) * baseRadius / 1, h2 + Math.cos(m + Math.PI) * baseRadius / 1);
            this.context.stroke();

            if (this.setup.showSeconds) {
                this.context.beginPath();
                this.context.lineWidth = 0.5;
                this.context.moveTo(w2, h2);
                //this.context.lineTo( w2 + Math.sin( s ) * height/16, h2 + Math.cos( s ) * height/16 );
                this.context.lineTo(
                    w2 + Math.sin(s + Math.PI) * baseRadius / 1,
                    h2 + Math.cos(s + Math.PI) * baseRadius / 1
                );
                this.context.stroke();
            }

            if (this.setup.showMarkers) {
                this.context.lineWidth = 2;
                for (let i = 0; i < 360; i += 30) {
                    const sz = i % 90 == 0 ? -0.5 : 0;
                    this.context.beginPath();
                    this.context.moveTo(
                        w2 + Math.sin(i * Math.PI / 180 + Math.PI) * baseRadius * (21 + sz) / 20,
                        h2 + Math.cos(i * Math.PI / 180 + Math.PI) * baseRadius * (21 + sz) / 20);
                    this.context.lineTo(
                        w2 + Math.sin(i * Math.PI / 180 + Math.PI) * baseRadius * 22 / 20,
                        h2 + Math.cos(i * Math.PI / 180 + Math.PI) * baseRadius * 22 / 20);
                    this.context.stroke();
                }
            }
        }
    }

}

const registration: Registration<AnalogClock> = {
    plugin: AnalogClock,
    schema: AnalogClock.schema
};

export default registration;