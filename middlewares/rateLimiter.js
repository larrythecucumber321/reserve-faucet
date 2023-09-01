"use strict";
exports.__esModule = true;
exports.RateLimiter = void 0;
var express_rate_limit_1 = require("express-rate-limit");
var range_check_1 = require("range_check");
var RateLimiter = /** @class */ (function () {
    function RateLimiter(app, configs, keyGenerator) {
        var _this = this;
        var _a, _b, _c, _d;
        this.PATH = configs[0].RATELIMIT.PATH || '/api/sendToken';
        var rateLimiters = new Map();
        configs.forEach(function (config) {
            var RATELIMIT = config.RATELIMIT;
            var RL_CONFIG = {
                MAX_LIMIT: RATELIMIT.MAX_LIMIT,
                WINDOW_SIZE: RATELIMIT.WINDOW_SIZE,
                SKIP_FAILED_REQUESTS: RATELIMIT.SKIP_FAILED_REQUESTS || true
            };
            rateLimiters.set(config.ID, _this.getLimiter(RL_CONFIG, keyGenerator));
        });
        if ((_b = (_a = configs[0]) === null || _a === void 0 ? void 0 : _a.RATELIMIT) === null || _b === void 0 ? void 0 : _b.REVERSE_PROXIES) {
            app.set('trust proxy', (_d = (_c = configs[0]) === null || _c === void 0 ? void 0 : _c.RATELIMIT) === null || _d === void 0 ? void 0 : _d.REVERSE_PROXIES);
        }
        app.use(this.PATH, function (req, res, next) {
            if (_this.PATH == '/api/sendToken' && req.body.chain) {
                return rateLimiters.get(req.body.erc20 ? req.body.erc20 : req.body.chain)(req, res, next);
            }
            else {
                return rateLimiters.get(configs[0].ID)(req, res, next);
            }
        });
    }
    RateLimiter.prototype.getLimiter = function (config, keyGenerator) {
        var _this = this;
        var limiter = (0, express_rate_limit_1["default"])({
            windowMs: config.WINDOW_SIZE * 60 * 1000,
            max: config.MAX_LIMIT,
            standardHeaders: true,
            legacyHeaders: false,
            skipFailedRequests: config.SKIP_FAILED_REQUESTS,
            message: {
                message: "Too many requests. Please try again after ".concat(config.WINDOW_SIZE, " minutes")
            },
            keyGenerator: keyGenerator ? keyGenerator : function (req, res) {
                var ip = _this.getIP(req);
                if (ip != null) {
                    return ip;
                }
            }
        });
        return limiter;
    };
    RateLimiter.prototype.getIP = function (req) {
        var ip = req.headers['cf-connecting-ip'] || req.ip;
        return (0, range_check_1.searchIP)(ip);
    };
    return RateLimiter;
}());
exports.RateLimiter = RateLimiter;
