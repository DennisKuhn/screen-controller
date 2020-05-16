import { SetupBaseInterface, Plugin as PluginSetup } from '../src/Setup/Application/Plugin';
import { PluginBase, Registration } from '../src/plugins/PluginBase';
import { JSONSchema7 } from 'json-schema';


export class AnalogClockSetup extends PluginSetup {
    showSeconds: boolean;
    showMarkers: boolean;

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

    constructor(source: SetupBaseInterface) {
        super(source);

        const { showSeconds, showMarkers } = (super.update(source) as AnalogClockSetup);

        this.showSeconds = showSeconds;
        this.showMarkers = showMarkers;
    }
}


/**
 * Displays an analog clock, optional markers and seconds hand.
 */
export class AnalogClock extends PluginBase {
    visible = true;

    setup: AnalogClockSetup;

    constructor(setup: PluginSetup) {        
        super(setup);

        this.setup = setup as AnalogClockSetup;
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

    render(context, gradient): void {
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
            context.fillStyle = gradient;
            context.strokeStyle = gradient;

            context.lineWidth = 8;
            context.beginPath();
            context.moveTo(w2, h2);
            context.lineTo(w2 + Math.sin(hour + Math.PI) * baseRadius / 2, h2 + Math.cos(hour + Math.PI) * baseRadius / 2);
            context.stroke();
            context.lineWidth = 4;
            context.beginPath();
            context.moveTo(w2, h2);
            context.lineTo(w2 + Math.sin(m + Math.PI) * baseRadius / 1, h2 + Math.cos(m + Math.PI) * baseRadius / 1);
            context.stroke();

            if (this.setup.showSeconds) {
                context.beginPath();
                context.lineWidth = 0.5;
                context.moveTo(w2, h2);
                //context.lineTo( w2 + Math.sin( s ) * height/16, h2 + Math.cos( s ) * height/16 );
                context.lineTo(
                    w2 + Math.sin(s + Math.PI) * baseRadius / 1,
                    h2 + Math.cos(s + Math.PI) * baseRadius / 1
                );
                context.stroke();
            }

            if (this.setup.showMarkers) {
                context.lineWidth = 2;
                for (let i = 0; i < 360; i += 30) {
                    const sz = i % 90 == 0 ? -0.5 : 0;
                    context.beginPath();
                    context.moveTo(
                        w2 + Math.sin(i * Math.PI / 180 + Math.PI) * baseRadius * (21 + sz) / 20,
                        h2 + Math.cos(i * Math.PI / 180 + Math.PI) * baseRadius * (21 + sz) / 20);
                    context.lineTo(
                        w2 + Math.sin(i * Math.PI / 180 + Math.PI) * baseRadius * 22 / 20,
                        h2 + Math.cos(i * Math.PI / 180 + Math.PI) * baseRadius * 22 / 20);
                    context.stroke();
                }
            }
        }
    }

}

const registration: Registration<AnalogClock, AnalogClockSetup> = {
    plugin: AnalogClock,
    setup: AnalogClockSetup,
    schema: AnalogClockSetup.schema
};

export default registration;