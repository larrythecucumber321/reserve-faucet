"use strict";
exports.__esModule = true;
exports.parseBody = exports.parseURI = void 0;
var body_parser_1 = require("body-parser");
var parseURI = function (req, res, next) {
    var err = null;
    try {
        decodeURIComponent(req.path);
    }
    catch (e) {
        err = e;
    }
    if (err) {
        return res.redirect('/');
    }
    next();
};
exports.parseURI = parseURI;
var parseBody = function (req, res, next) {
    body_parser_1["default"].json()(req, res, function (error) {
        if (error && error.status >= 400) {
            res.status(400).send({ message: "Invalid request body" });
        }
        else {
            next();
        }
    });
};
exports.parseBody = parseBody;
