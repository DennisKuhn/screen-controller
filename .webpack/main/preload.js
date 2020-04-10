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

/***/ "./src/infrastructure/ConfigController.ts":
/*!************************************************!*\
  !*** ./src/infrastructure/ConfigController.ts ***!
  \************************************************/
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
var url_1 = __importDefault(__webpack_require__(/*! url */ "url"));
var fs_1 = __importDefault(__webpack_require__(/*! fs */ "fs"));
var ConfigOption = /** @class */ (function () {
    function ConfigOption() {
    }
    return ConfigOption;
}());
var ConfigProperty = /** @class */ (function () {
    function ConfigProperty() {
    }
    return ConfigProperty;
}());
var ConfigSettings = /** @class */ (function () {
    /**
     *
     */
    function ConfigSettings(displayId, baseUrl) {
        this.baseUrl = baseUrl; // url.pathToFileURL(file);
        this.baseId = crypto_1.default.createHash('md5').update(this.baseUrl.href).digest('hex');
        this.displayId = displayId;
        this.configId = this.displayId + "-" + this.baseId + "-config";
        console.log(this.constructor.name + "(): " + this.configId + " = " + this.displayId + " + " + this.baseId + " (" + this.baseUrl.href + ")");
        this.loadConfig();
    }
    ConfigSettings.prototype.loadConfig = function () {
        console.log(this.constructor.name + ": " + this.configId);
        var configString = localStorage.getItem(this.configId);
        if (configString) {
            try {
                this.config = JSON.parse(configString);
                this.userProperties = this.config.general.properties;
                console.log(this.constructor.name + ": " + this.configId + ": loaded config", this.userProperties, this.config);
            }
            catch (loadConfigError) {
                console.error(this.constructor.name + ": " + this.configId + ": Error parsing config JSON:" + loadConfigError + ": " + configString + " file: " + this.baseUrl.href, loadConfigError, configString);
            }
        }
        else {
            console.warn(this.constructor.name + ": " + this.configId + ": no config: " + this.baseUrl.href);
        }
    };
    /**
     *
     * @param {string} file path
     */
    ConfigSettings.prototype.loadDefault = function () {
        return __awaiter(this, void 0, Promise, function () {
            var defaultLocation, defaultPath, buffer, loadError_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        defaultLocation = this.baseUrl.href.substring(0, this.baseUrl.href.lastIndexOf('/') + 1) + 'project.json';
                        defaultPath = url_1.default.fileURLToPath(this.baseUrl.href.substring(0, this.baseUrl.href.lastIndexOf('/') + 1) + 'project.json');
                        console.log(this.constructor.name + ": " + this.configId + ": defaultLocation: " + defaultLocation + " defaultPath: " + defaultPath + " file: " + this.baseUrl.href);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, fs_1.default.promises.readFile(defaultPath)];
                    case 2:
                        buffer = _a.sent();
                        this.config = JSON.parse(buffer.toString());
                        this.userProperties = this.config.general.properties;
                        console.log(this.constructor.name + ": " + this.configId + ": loaded default", this.userProperties, this.config);
                        return [3 /*break*/, 4];
                    case 3:
                        loadError_1 = _a.sent();
                        console.error(this.constructor.name + ": " + this.configId + ": ERROR loading default:" + loadError_1 + ":" + defaultLocation, loadError_1, defaultLocation);
                        return [3 /*break*/, 4];
                    case 4:
                        if (this.config) {
                            try {
                                localStorage.setItem(this.configId, JSON.stringify(this.config));
                                console.log(this.constructor.name + ": " + this.configId + ": stored default", this.config);
                            }
                            catch (storeError) {
                                console.error(this.constructor.name + ": " + this.configId + ": ERROR storing default:" + storeError + ":" + defaultLocation, storeError, defaultLocation);
                            }
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    return ConfigSettings;
}());
/**
 * Loads configuration from storage and provides interface to configuration updates through channel.
 * @module
 */
var ConfigController = /** @class */ (function () {
    /**
     *
     */
    function ConfigController() {
        console.error(this.constructor.name + "()");
    }
    ConfigController.getConfig = function (displayId, baseUrl) {
        return __awaiter(this, void 0, Promise, function () {
            var setting;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        setting = ConfigController.settings.find(function (candidate) { return candidate.displayId == displayId && candidate.baseUrl == baseUrl; });
                        if (!!setting) return [3 /*break*/, 2];
                        setting = new ConfigSettings(displayId, baseUrl);
                        ConfigController.settings.push(setting);
                        if (!!setting.config) return [3 /*break*/, 2];
                        return [4 /*yield*/, setting.loadDefault()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/, setting.config];
                }
            });
        });
    };
    ConfigController.start = function () {
        // Get displayId from argV and url from window.locaiton.href
        ConfigController.getConfig(Number(process.argv.find(function (arg) {
            return /^--displayid=/.test(arg);
        }).split('=')[1]), url_1.default.parse(window.location.href, false, false)).then(function () {
            ConfigController.connectToWallpaper();
        });
    };
    /**
     * Exposes interface to wallpaper window, e.g. window.wallpaper.register(listeners)
     */
    ConfigController.connectToWallpaper = function () {
        // Expose protected methods that allow the renderer process to use
        // the ipcRenderer without exposing the entire object
        window.wallpaper = {
            register: ConfigController.registerPage
        };
    };
    ConfigController.settings = [];
    ConfigController.onNewSettings = function (e, settingText) { return __awaiter(void 0, void 0, Promise, function () {
        var setting, changedSettings, settingsError_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setting = ConfigController.settings[0];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, JSON.parse(settingText)];
                case 2:
                    changedSettings = _a.sent();
                    ConfigController.listeners.user(changedSettings);
                    return [3 /*break*/, 4];
                case 3:
                    settingsError_1 = _a.sent();
                    console.error("ConfigController: " + setting.configId + ": ERROR updating user setting:" + settingsError_1 + ":" + settingText, settingsError_1, settingText);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    ConfigController.registerPage = function (listeners) {
        var setting = ConfigController.settings[0];
        ConfigController.listeners = listeners;
        console.log("ConfigController: " + setting.configId + ": " + Object.keys(setting.userProperties).length + ": register", listeners, setting.userProperties);
        if (ConfigController.listeners.user) {
            try {
                ConfigController.listeners.user(setting.userProperties);
            }
            catch (initialError) {
                console.error("ConfigController: " + setting.configId + ": ERROR initial user setting:" + initialError + ":", initialError, setting.userProperties);
            }
            electron_1.ipcRenderer.on(setting.configId + '-userSettings', ConfigController.onNewSettings);
        }
    };
    return ConfigController;
}());
exports.default = ConfigController;


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
var ConfigController_1 = __importDefault(__webpack_require__(/*! ./ConfigController */ "./src/infrastructure/ConfigController.ts"));
console.log('preload included');
process.once('loaded', function () {
    ConfigController_1.default.start();
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

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("fs");

/***/ }),

/***/ "url":
/*!**********************!*\
  !*** external "url" ***!
  \**********************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("url");

/***/ })

/******/ });
//# sourceMappingURL=preload.js.map