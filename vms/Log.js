"use strict";
exports.__esModule = true;
var Log = /** @class */ (function () {
    function Log(chain) {
        var _this = this;
        this.error = function (message) {
            console.log("ERROR ".concat(_this.chain, ": ").concat(message));
        };
        this.warn = function (message) {
            console.log("WARNING ".concat(_this.chain, ": ").concat(message));
        };
        this.info = function (message) {
            console.log("INFO ".concat(_this.chain, ": ").concat(message));
        };
        this.chain = chain;
    }
    return Log;
}());
exports["default"] = Log;
