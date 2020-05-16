"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var Plugin_1 = require("../src/Setup/Application/Plugin");
var PluginBase_1 = require("../src/plugins/PluginBase");
var AnalogClockSetup = /** @class */ (function (_super) {
    __extends(AnalogClockSetup, _super);
    function AnalogClockSetup(source) {
        var _this = _super.call(this, source) || this;
        var _a = _super.prototype.update.call(_this, source), showSeconds = _a.showSeconds, showMarkers = _a.showMarkers;
        _this.showSeconds = showSeconds;
        _this.showMarkers = showMarkers;
        return _this;
    }
    AnalogClockSetup.schema = {
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
    return AnalogClockSetup;
}(Plugin_1.Plugin));
exports.AnalogClockSetup = AnalogClockSetup;
/**
 * Displays an analog clock, optional markers and seconds hand.
 */
var AnalogClock = /** @class */ (function (_super) {
    __extends(AnalogClock, _super);
    function AnalogClock(setup) {
        var _this = _super.call(this, setup) || this;
        _this.visible = true;
        _this.setup = setup;
        return _this;
    }
    Object.defineProperty(AnalogClock.prototype, "Visible", {
        /**
         * @returns {boolean}
         */
        get: function () {
            return this.visible;
        },
        set: function (visible) {
            this.visible = visible;
        },
        enumerable: true,
        configurable: true
    });
    AnalogClock.prototype.render = function (context, gradient) {
        if (!this.setup.scaledBounds)
            throw new Error(this.constructor.name + ".render: no scaledBounds");
        if (this.visible) {
            var w2 = this.setup.scaledBounds.width / 2; //0;
            var h2 = this.setup.scaledBounds.height / 2; //0;
            var baseRadius = Math.min(this.setup.scaledBounds.width, this.setup.scaledBounds.height) / 3;
            var dt = new Date();
            var hour = -Math.PI * 2 * (dt.getHours() % 12) / 12;
            var m = -Math.PI * 2 * dt.getMinutes() / 60;
            var s = -Math.PI * 2 * dt.getSeconds() / 60;
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
                context.lineTo(w2 + Math.sin(s + Math.PI) * baseRadius / 1, h2 + Math.cos(s + Math.PI) * baseRadius / 1);
                context.stroke();
            }
            if (this.setup.showMarkers) {
                context.lineWidth = 2;
                for (var i = 0; i < 360; i += 30) {
                    var sz = i % 90 == 0 ? -0.5 : 0;
                    context.beginPath();
                    context.moveTo(w2 + Math.sin(i * Math.PI / 180 + Math.PI) * baseRadius * (21 + sz) / 20, h2 + Math.cos(i * Math.PI / 180 + Math.PI) * baseRadius * (21 + sz) / 20);
                    context.lineTo(w2 + Math.sin(i * Math.PI / 180 + Math.PI) * baseRadius * 22 / 20, h2 + Math.cos(i * Math.PI / 180 + Math.PI) * baseRadius * 22 / 20);
                    context.stroke();
                }
            }
        }
    };
    return AnalogClock;
}(PluginBase_1.PluginBase));
exports.AnalogClock = AnalogClock;
var registration = {
    plugin: AnalogClock,
    setup: AnalogClockSetup,
    schema: AnalogClockSetup.schema
};
exports["default"] = registration;
