module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/infrastructure/preload.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/infrastructure/configmanager.ts":
/*!*********************************************!*\
  !*** ./src/infrastructure/configmanager.ts ***!
  \*********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = __webpack_require__(/*! electron */ "electron");
var crypto_1 = __importDefault(__webpack_require__(/*! crypto */ "crypto"));
/**
 * Loads configuration from storage and provides interface to configuration updates through channel.
 * @module
 */
var ConfigManager = /** @class */ (function () {
    /**
     *
     */
    function ConfigManager() {
        this.locationHref = window.location.href;
        this.sourceId = crypto_1.default.createHash('md5').update(this.locationHref).digest('hex');
        this.displayId = process.argv.find(function (arg) {
            return /^--displayid=/.test(arg);
        }).split('=')[1];
        this.settingsId = this.displayId + "-" + this.sourceId + "-config";
        console.log(this.constructor.name + "(): " + this.settingsId + " = " + this.displayId + " + " + this.sourceId + " (" + this.locationHref + ")");
        this.loadConfig();
        this.connectToWallpaper();
    }
    /**
     * Exposes interface to wallpaper window, e.g. window.wallpaper.register(listeners)
     */
    ConfigManager.prototype.connectToWallpaper = function () {
        var _this = this;
        // Expose protected methods that allow the renderer process to use
        // the ipcRenderer without exposing the entire object
        window.wallpaper = {
            register: function (listeners) {
                console.log(_this.constructor.name + ": " + _this.settingsId + ": " + Object.keys(_this.userProperties).length + ": register", listeners, _this.userProperties);
                if (listeners.user) {
                    try {
                        listeners.user(_this.userProperties);
                    }
                    catch (initialError) {
                        console.error(_this.constructor.name + ": " + _this.settingsId + ": ERROR initial user setting:" + initialError + ":", initialError, _this.userProperties);
                    }
                    electron_1.ipcRenderer.on(_this.settingsId + '-userSettings', function (e, settingText) { return __awaiter(_this, void 0, void 0, function () {
                        var changedSettings, settingsError_1;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, JSON.parse(settingText)];
                                case 1:
                                    changedSettings = _a.sent();
                                    listeners.user(changedSettings);
                                    return [3 /*break*/, 3];
                                case 2:
                                    settingsError_1 = _a.sent();
                                    console.error(this.constructor.name + ": " + this.settingsId + ": ERROR updating user setting:" + settingsError_1 + ":" + settingText, settingsError_1, settingText);
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                }
            }
        };
    };
    /**
     *
     */
    ConfigManager.prototype.loadConfig = function () {
        console.log(this.constructor.name + ": " + this.settingsId);
        var configString = localStorage.getItem(this.settingsId);
        if (configString) {
            try {
                this.config = JSON.parse(configString);
                this.userProperties = this.config.general.properties;
                console.log(this.constructor.name + ": " + this.settingsId + ": loaded config", this.userProperties, this.config);
            }
            catch (loadConfigError) {
                console.error(this.constructor.name + ": " + this.settingsId + ": Error parsing config JSON:" + loadConfigError + ": " + configString + " file: " + this.locationHref, loadConfigError, configString);
            }
        }
        else {
            console.warn(this.constructor.name + ": " + this.settingsId + ": no config: " + this.locationHref);
        }
    };
    return ConfigManager;
}());
exports.default = ConfigManager;


/***/ }),

/***/ "./src/infrastructure/preload.ts":
/*!***************************************!*\
  !*** ./src/infrastructure/preload.ts ***!
  \***************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var configmanager_1 = __importDefault(__webpack_require__(/*! ./configmanager */ "./src/infrastructure/configmanager.ts"));
var configManager;
console.log('preload included');
process.once('loaded', function () {
    configManager = new configmanager_1.default();
});


/***/ }),

/***/ "crypto":
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("crypto");

/***/ }),

/***/ "electron":
/*!***************************!*\
  !*** external "electron" ***!
  \***************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("electron");

/***/ })

/******/ });
//# sourceMappingURL=preload.js.map