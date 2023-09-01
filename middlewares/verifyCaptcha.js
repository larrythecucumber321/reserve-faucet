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
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
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
exports.__esModule = true;
exports.VerifyCaptcha = void 0;
var axios = require('axios');
var VerifyCaptcha = /** @class */ (function () {
    function VerifyCaptcha(app, CAPTCHA_SECRET, V2_CAPTCHA_SECRET) {
        var _this = this;
        this.middleware = function (req, res, next) { return _this.verifyCaptcha(req, res, next); };
        if (typeof CAPTCHA_SECRET != "string") {
            throw "Captcha Secret should be string";
        }
        this.secret = CAPTCHA_SECRET;
        this.v2secret = V2_CAPTCHA_SECRET;
    }
    VerifyCaptcha.prototype.verifyV2Token = function (v2Token) {
        return __awaiter(this, void 0, void 0, function () {
            var URL_1, response, err_1, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!v2Token) return [3 /*break*/, 5];
                        URL_1 = "https://www.google.com/recaptcha/api/siteverify?secret=".concat(this.v2secret, "&response=").concat(v2Token);
                        response = void 0;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, axios.post(URL_1)
                                .then(function (r) {
                                return r;
                            })];
                    case 2:
                        response = _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        err_1 = _a.sent();
                        console.log("Recaptcha V2 error:", err_1 === null || err_1 === void 0 ? void 0 : err_1.message);
                        return [3 /*break*/, 4];
                    case 4:
                        data = response === null || response === void 0 ? void 0 : response.data;
                        if (data === null || data === void 0 ? void 0 : data.success) {
                            return [2 /*return*/, true];
                        }
                        _a.label = 5;
                    case 5: return [2 /*return*/, false];
                }
            });
        });
    };
    VerifyCaptcha.prototype.verifyV3Token = function (v3Token) {
        return __awaiter(this, void 0, void 0, function () {
            var URL, response, err_2, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        URL = "https://www.google.com/recaptcha/api/siteverify?secret=".concat(this.secret, "&response=").concat(v3Token);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, axios.post(URL)];
                    case 2:
                        response = _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        err_2 = _a.sent();
                        console.log("Recaptcha V3 error:", err_2 === null || err_2 === void 0 ? void 0 : err_2.message);
                        return [3 /*break*/, 4];
                    case 4:
                        data = response === null || response === void 0 ? void 0 : response.data;
                        if (data === null || data === void 0 ? void 0 : data.success) {
                            if ((data === null || data === void 0 ? void 0 : data.action) == 'faucetdrip') {
                                if ((data === null || data === void 0 ? void 0 : data.score) > 0.5) {
                                    return [2 /*return*/, true];
                                }
                            }
                        }
                        return [2 /*return*/, false];
                }
            });
        });
    };
    VerifyCaptcha.prototype.shouldAllow = function (token, v2Token) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = false;
                        if (!_a) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.verifyV3Token(token)];
                    case 1:
                        _a = (_b.sent());
                        _b.label = 2;
                    case 2:
                        if (!_a) return [3 /*break*/, 3];
                        return [2 /*return*/, true];
                    case 3: return [4 /*yield*/, this.verifyV2Token(v2Token)];
                    case 4:
                        if (_b.sent()) {
                            return [2 /*return*/, true];
                        }
                        _b.label = 5;
                    case 5: return [2 /*return*/, false];
                }
            });
        });
    };
    VerifyCaptcha.prototype.verifyCaptcha = function (req, res, next) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var shouldAllow;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, this.shouldAllow((_a = req === null || req === void 0 ? void 0 : req.body) === null || _a === void 0 ? void 0 : _a.token, (_b = req === null || req === void 0 ? void 0 : req.body) === null || _b === void 0 ? void 0 : _b.v2Token)];
                    case 1:
                        shouldAllow = _c.sent();
                        if (shouldAllow) {
                            next();
                        }
                        else {
                            return [2 /*return*/, res.status(400).send({ message: "Captcha verification failed! Try solving below." })];
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    return VerifyCaptcha;
}());
exports.VerifyCaptcha = VerifyCaptcha;
