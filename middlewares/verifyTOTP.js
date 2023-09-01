"use strict";
exports.__esModule = true;
exports.VerifyTOTP = void 0;
var totp_generator_1 = require("totp-generator");
var VerifyTOTP = /** @class */ (function () {
    function VerifyTOTP(KEY) {
        var _this = this;
        this.middleware = function (req, res, next) { return _this.verifyTOTP(req, res, next); };
        if (typeof KEY != "string") {
            throw "TOTP key should be a string";
        }
        this.KEY = KEY;
    }
    VerifyTOTP.prototype.verifyTOTP = function (req, res, next) {
        var _a;
        var token = (0, totp_generator_1["default"])(this.KEY);
        if (((_a = req.query) === null || _a === void 0 ? void 0 : _a.token) == token) {
            next();
        }
        else {
            res.status(403).send("Access denied! Invalid token.");
        }
    };
    return VerifyTOTP;
}());
exports.VerifyTOTP = VerifyTOTP;
