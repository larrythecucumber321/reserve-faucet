"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var avalanche_1 = require("avalanche");
var web3_1 = require("web3");
var utils_1 = require("./utils");
var Log_1 = require("./Log");
var ERC20Interface_json_1 = require("./ERC20Interface.json");
var MultiSendInterface_json_1 = require("./MultiSendInterface.json");
// cannot issue tx if no. of pending requests is > 16
var MEMPOOL_LIMIT = 15;
// pending tx timeout should be a function of MEMPOOL_LIMIT
var PENDING_TX_TIMEOUT = 40 * 1000; // 40 seconds
var BLOCK_FAUCET_DRIPS_TIMEOUT = 1 * 1000; // 1 seconds
var EVM = /** @class */ (function () {
    function EVM(config, PK) {
        var _this = this;
        this.web3 = new web3_1["default"](config.RPC);
        this.account = this.web3.eth.accounts.privateKeyToAccount(PK);
        this.contracts = new Map();
        this.NAME = config.NAME;
        this.DECIMALS = config.DECIMALS || 18;
        this.DRIP_AMOUNT = (0, utils_1.calculateBaseUnit)(config.DRIP_AMOUNT.toString(), this.DECIMALS);
        this.MAX_PRIORITY_FEE = config.MAX_PRIORITY_FEE;
        this.MAX_FEE = config.MAX_FEE;
        this.RECALIBRATE = config.RECALIBRATE || 30;
        this.MULTI_SEND = config.MULTI_SEND;
        this.LEGACY = false;
        this.log = new Log_1["default"](this.NAME);
        this.hasNonce = new Map();
        this.hasError = new Map();
        this.pendingTxNonces = new Set();
        this.nonce = -1;
        this.balance = new avalanche_1.BN(0);
        this.isFetched = false;
        this.isUpdating = false;
        this.recalibrate = false;
        this.waitingForRecalibration = false;
        this.queuingInProgress = false;
        this.recalibrateNowActivated = false;
        this.requestCount = 0;
        this.waitArr = [];
        this.queue = [];
        this.error = false;
        this.blockFaucetDrips = true;
        this.setupTransactionType();
        this.recalibrateNonceAndBalance();
        setInterval(function () {
            _this.recalibrateNonceAndBalance();
        }, this.RECALIBRATE * 1000);
        // just a check that requestCount is within the range (will indicate race condition)
        setInterval(function () {
            if (_this.requestCount > MEMPOOL_LIMIT || _this.requestCount < 0) {
                _this.log.error("request count not in range: ".concat(_this.requestCount));
            }
        }, 10 * 1000);
        // block requests during restart (to settle any pending txs initiated during shutdown)
        setTimeout(function () {
            _this.log.info("starting faucet drips...");
            _this.blockFaucetDrips = false;
        }, BLOCK_FAUCET_DRIPS_TIMEOUT);
    }
    // Setup Legacy or EIP1559 transaction type
    EVM.prototype.setupTransactionType = function () {
        return __awaiter(this, void 0, void 0, function () {
            var baseFee, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.web3.eth.getBlock("latest")];
                    case 1:
                        baseFee = (_a.sent()).baseFeePerGas;
                        if (baseFee == undefined) {
                            this.LEGACY = true;
                        }
                        this.error = false;
                        return [3 /*break*/, 3];
                    case 2:
                        err_1 = _a.sent();
                        this.error = true;
                        this.log.error(err_1.message);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Function to issue transfer transaction. For ERC20 transfers, 'id' will be a string representing ERC20 token ID
    EVM.prototype.sendToken = function (receiver, hashedName, cb) {
        return __awaiter(this, void 0, void 0, function () {
            var tokenAmounts, _i, _a, config, multiSend, multiSendContract, twitterUserClaimed, addressClaimed, txData, tx, signedTx, err_2, txHash, rawTransaction, err_3;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (this.blockFaucetDrips) {
                            cb({
                                status: 400,
                                message: "Faucet is getting started! Please try after sometime"
                            });
                            return [2 /*return*/];
                        }
                        if (this.error) {
                            cb({
                                status: 400,
                                message: "Internal RPC error! Please try after sometime"
                            });
                            return [2 /*return*/];
                        }
                        if (!this.web3.utils.isAddress(receiver)) {
                            cb({ status: 400, message: "Invalid address! Please try again." });
                            return [2 /*return*/];
                        }
                        // do not accept any request if mempool limit reached
                        if (this.requestCount >= MEMPOOL_LIMIT) {
                            cb({
                                status: 400,
                                message: "High faucet usage! Please try after sometime"
                            });
                            return [2 /*return*/];
                        }
                        // increasing request count before processing request
                        this.requestCount++;
                        tokenAmounts = [];
                        for (_i = 0, _a = this.contracts.values(); _i < _a.length; _i++) {
                            config = _a[_i].config;
                            tokenAmounts.push({
                                address: config.CONTRACTADDRESS,
                                amount: (0, utils_1.calculateBaseUnit)(config.DRIP_AMOUNT.toString(), config.DECIMALS || 18)
                            });
                        }
                        multiSend = this.MULTI_SEND;
                        multiSendContract = new this.web3.eth.Contract(MultiSendInterface_json_1["default"], multiSend);
                        return [4 /*yield*/, multiSendContract.methods
                                .hashedNames(hashedName)
                                .call()];
                    case 1:
                        twitterUserClaimed = _b.sent();
                        return [4 /*yield*/, multiSendContract.methods
                                .claimedAddresses(receiver)
                                .call()];
                    case 2:
                        addressClaimed = _b.sent();
                        if (twitterUserClaimed || addressClaimed) {
                            cb({
                                status: 429,
                                message: "You've already claimed. Only one per person"
                            });
                            return [2 /*return*/];
                        }
                        txData = multiSendContract.methods.multisendTokenWithLogging(receiver, tokenAmounts.map(function (x) { return x.address; }), tokenAmounts.map(function (x) { return x.amount; }), hashedName);
                        tx = {
                            type: 2,
                            gas: "300000",
                            data: txData.encodeABI(),
                            to: multiSend,
                            maxPriorityFeePerGas: this.MAX_PRIORITY_FEE,
                            maxFeePerGas: this.MAX_FEE,
                            value: 0
                        };
                        _b.label = 3;
                    case 3:
                        _b.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, this.account.signTransaction(tx)];
                    case 4:
                        signedTx = _b.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        err_2 = _b.sent();
                        this.error = true;
                        this.log.error(err_2.message);
                        return [3 /*break*/, 6];
                    case 6:
                        txHash = signedTx === null || signedTx === void 0 ? void 0 : signedTx.transactionHash;
                        rawTransaction = signedTx === null || signedTx === void 0 ? void 0 : signedTx.rawTransaction;
                        _b.label = 7;
                    case 7:
                        _b.trys.push([7, 9, 10, 11]);
                        /*
                         * asyncCallWithTimeout function can return
                         * 1. successfull response
                         * 2. throw API error (will be catched by catch block)
                         * 3. throw timeout error (will be catched by catch block)
                         */
                        this.nonce++;
                        return [4 /*yield*/, (0, utils_1.asyncCallWithTimeout)(this.web3.eth.sendSignedTransaction(rawTransaction), PENDING_TX_TIMEOUT, "Timeout reached for transaction with nonce ".concat(this.nonce))];
                    case 8:
                        _b.sent();
                        cb({
                            status: 200,
                            message: "Transaction successful on ".concat(this.NAME, "!"),
                            txHash: txHash
                        });
                        return [3 /*break*/, 11];
                    case 9:
                        err_3 = _b.sent();
                        this.log.error(err_3.message);
                        cb({
                            status: 400,
                            message: "Transaction failed on ".concat(this.NAME, "! Please try again.")
                        });
                        return [3 /*break*/, 11];
                    case 10:
                        this.requestCount--;
                        return [7 /*endfinally*/];
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    /*
     * put in waiting array, if:
     * 1. balance/nonce is not fetched yet
     * 2. recalibrate in progress
     * 3. waiting for pending txs to confirm to begin recalibration
     *
     * else put in execution queue
     */
    EVM.prototype.processRequest = function (req) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(!this.isFetched || this.recalibrate || this.waitingForRecalibration)) return [3 /*break*/, 3];
                        this.waitArr.push(req);
                        if (!(!this.isUpdating && !this.waitingForRecalibration)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.updateNonceAndBalance()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [3 /*break*/, 4];
                    case 3:
                        this.putInQueue(req);
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    EVM.prototype.getBalance = function (id) {
        if (id && this.contracts.get(id)) {
            return this.getERC20Balance(id);
        }
        else {
            return this.balance;
        }
    };
    EVM.prototype.getERC20Balance = function (id) {
        var _a;
        return (_a = this.contracts.get(id)) === null || _a === void 0 ? void 0 : _a.balance;
    };
    EVM.prototype.fetchERC20Balance = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                this.contracts.forEach(function (contract) { return __awaiter(_this, void 0, void 0, function () {
                    var balance, err_4;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                balance = new avalanche_1.BN(0);
                                _a.label = 1;
                            case 1:
                                _a.trys.push([1, 3, , 4]);
                                return [4 /*yield*/, contract.methods.balanceOf(this.account.address).call()];
                            case 2:
                                _a.sent();
                                return [3 /*break*/, 4];
                            case 3:
                                err_4 = _a.sent();
                                return [3 /*break*/, 4];
                            case 4:
                                contract.balance = new avalanche_1.BN(balance);
                                return [2 /*return*/];
                        }
                    });
                }); });
                return [2 /*return*/];
            });
        });
    };
    EVM.prototype.updateNonceAndBalance = function () {
        return __awaiter(this, void 0, void 0, function () {
            var err_5;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        // skip if already updating
                        if (this.isUpdating) {
                            return [2 /*return*/];
                        }
                        this.isUpdating = true;
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, Promise.all([
                                this.web3.eth.getTransactionCount(this.account.address, "latest"),
                                this.web3.eth.getBalance(this.account.address),
                            ])];
                    case 2:
                        _a = _b.sent(), this.nonce = _a[0], this.balance = _a[1];
                        return [4 /*yield*/, this.fetchERC20Balance()];
                    case 3:
                        _b.sent();
                        this.balance = new avalanche_1.BN(this.balance);
                        this.error && this.log.info("RPC server recovered!");
                        this.error = false;
                        this.isFetched = true;
                        this.isUpdating = false;
                        this.recalibrate = false;
                        while (this.waitArr.length != 0) {
                            this.putInQueue(this.waitArr.shift());
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        err_5 = _b.sent();
                        this.isUpdating = false;
                        this.error = true;
                        this.log.error(err_5.message);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    EVM.prototype.balanceCheck = function (req) {
        var balance = this.getBalance(req.id);
        if (req.id && this.contracts.get(req.id)) {
            if (this.contracts.get(req.id).balance.gte(req.amount)) {
                this.contracts.get(req.id).balance = this.contracts
                    .get(req.id)
                    .balance.sub(req.amount);
                return true;
            }
        }
        else {
            if (this.balance.gte(req.amount)) {
                this.balance = this.balance.sub(req.amount);
                return true;
            }
        }
        return false;
    };
    /*
     * 1. pushes a request in queue with the last calculated nonce
     * 2. sets `hasNonce` corresponding to `requestId` so users receive expected tx_hash
     * 3. increments the nonce for future request
     * 4. executes the queue
     */
    EVM.prototype.putInQueue = function (req) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // this will prevent recalibration if it's started after calling putInQueue() function
                this.queuingInProgress = true;
                // checking faucet balance before putting request in queue
                if (this.balanceCheck(req)) {
                    this.queue.push(__assign(__assign({}, req), { nonce: this.nonce }));
                    this.hasNonce.set(req.requestId, this.nonce);
                    this.nonce++;
                    this.executeQueue();
                }
                else {
                    this.queuingInProgress = false;
                    this.requestCount--;
                    this.log.warn("Faucet balance too low! " + req.id + " " + this.getBalance(req.id));
                    this.hasError.set(req.receiver, "Faucet balance too low! Please try after sometime.");
                }
                return [2 /*return*/];
            });
        });
    };
    // pops the 1st request in queue, and call the utility function to issue the tx
    EVM.prototype.executeQueue = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, amount, receiver, nonce, id;
            return __generator(this, function (_b) {
                _a = this.queue.shift(), amount = _a.amount, receiver = _a.receiver, nonce = _a.nonce, id = _a.id;
                this.sendTokenUtil(amount, receiver, nonce, id);
                return [2 /*return*/];
            });
        });
    };
    EVM.prototype.sendTokenUtil = function (amount, receiver, nonce, id) {
        return __awaiter(this, void 0, void 0, function () {
            var rawTransaction, err_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // adding pending tx nonce in a set to prevent recalibration
                        this.pendingTxNonces.add(nonce);
                        // request from queue is now moved to pending txs list
                        this.queuingInProgress = false;
                        return [4 /*yield*/, this.getTransaction(receiver, amount, nonce, id)];
                    case 1:
                        rawTransaction = (_a.sent()).rawTransaction;
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, 5, 6]);
                        /*
                         * asyncCallWithTimeout function can return
                         * 1. successfull response
                         * 2. throw API error (will be catched by catch block)
                         * 3. throw timeout error (will be catched by catch block)
                         */
                        return [4 /*yield*/, (0, utils_1.asyncCallWithTimeout)(this.web3.eth.sendSignedTransaction(rawTransaction), PENDING_TX_TIMEOUT, "Timeout reached for transaction with nonce ".concat(nonce))];
                    case 3:
                        /*
                         * asyncCallWithTimeout function can return
                         * 1. successfull response
                         * 2. throw API error (will be catched by catch block)
                         * 3. throw timeout error (will be catched by catch block)
                         */
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 4:
                        err_6 = _a.sent();
                        this.log.error(err_6.message);
                        return [3 /*break*/, 6];
                    case 5:
                        this.pendingTxNonces["delete"](nonce);
                        this.requestCount--;
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    EVM.prototype.getTransaction = function (to, value, nonce, id) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function () {
            var tx, _d, txObject, signedTx, err_7, txHash, rawTransaction;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        tx = {
                            type: 2,
                            gas: "21000",
                            nonce: nonce,
                            to: to,
                            maxPriorityFeePerGas: this.MAX_PRIORITY_FEE,
                            maxFeePerGas: this.MAX_FEE,
                            value: value
                        };
                        if (!this.LEGACY) return [3 /*break*/, 2];
                        delete tx["maxPriorityFeePerGas"];
                        delete tx["maxFeePerGas"];
                        _d = tx;
                        return [4 /*yield*/, this.getAdjustedGasPrice()];
                    case 1:
                        _d.gasPrice = _e.sent();
                        tx.type = 0;
                        _e.label = 2;
                    case 2:
                        if (this.contracts.get(id)) {
                            txObject = (_a = this.contracts.get(id)) === null || _a === void 0 ? void 0 : _a.methods.transfer(to, value);
                            tx.data = txObject.encodeABI();
                            tx.value = 0;
                            tx.to = (_b = this.contracts.get(id)) === null || _b === void 0 ? void 0 : _b.config.CONTRACTADDRESS;
                            tx.gas = (_c = this.contracts.get(id)) === null || _c === void 0 ? void 0 : _c.config.GASLIMIT;
                        }
                        _e.label = 3;
                    case 3:
                        _e.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, this.account.signTransaction(tx)];
                    case 4:
                        signedTx = _e.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        err_7 = _e.sent();
                        this.error = true;
                        this.log.error(err_7.message);
                        return [3 /*break*/, 6];
                    case 6:
                        txHash = signedTx === null || signedTx === void 0 ? void 0 : signedTx.transactionHash;
                        rawTransaction = signedTx === null || signedTx === void 0 ? void 0 : signedTx.rawTransaction;
                        return [2 /*return*/, { txHash: txHash, rawTransaction: rawTransaction }];
                }
            });
        });
    };
    EVM.prototype.getGasPrice = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.web3.eth.getGasPrice()];
            });
        });
    };
    // get expected price from the network for legacy txs
    EVM.prototype.getAdjustedGasPrice = function () {
        return __awaiter(this, void 0, void 0, function () {
            var gasPrice, adjustedGas, err_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.getGasPrice()];
                    case 1:
                        gasPrice = _a.sent();
                        adjustedGas = Math.floor(gasPrice * 1.25);
                        return [2 /*return*/, Math.min(adjustedGas, parseInt(this.MAX_FEE))];
                    case 2:
                        err_8 = _a.sent();
                        this.error = true;
                        this.log.error(err_8.message);
                        return [2 /*return*/, 0];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /*
     * This function will trigger the re-calibration of nonce and balance.
     * 1. Sets `waitingForRecalibration` to `true`.
     * 2. Will not trigger re-calibration if:
     *   a. any txs are pending
     *   b. nonce or balance are already getting updated
     *   c. any request is being queued up for execution
     * 3. Checks at regular interval, when all the above conditions are suitable for re-calibration
     * 4. Keeps any new incoming request into `waitArr` until nonce and balance are updated
     */
    EVM.prototype.recalibrateNonceAndBalance = function () {
        return __awaiter(this, void 0, void 0, function () {
            var recalibrateNow_1;
            var _this = this;
            return __generator(this, function (_a) {
                this.waitingForRecalibration = true;
                if (this.pendingTxNonces.size === 0 &&
                    this.isUpdating === false &&
                    this.queuingInProgress === false) {
                    this.isFetched = false;
                    this.recalibrate = true;
                    this.waitingForRecalibration = false;
                    this.pendingTxNonces.clear();
                    this.updateNonceAndBalance();
                }
                else if (this.recalibrateNowActivated === false) {
                    recalibrateNow_1 = setInterval(function () {
                        _this.recalibrateNowActivated = true;
                        if (_this.pendingTxNonces.size === 0 &&
                            _this.isUpdating === false &&
                            _this.queuingInProgress === false) {
                            clearInterval(recalibrateNow_1);
                            _this.recalibrateNowActivated = false;
                            _this.waitingForRecalibration = false;
                            _this.recalibrateNonceAndBalance();
                        }
                    }, 300);
                }
                return [2 /*return*/];
            });
        });
    };
    EVM.prototype.addERC20Contract = function (config) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.contracts.set(config.ID, {
                    methods: new this.web3.eth.Contract(ERC20Interface_json_1["default"], config.CONTRACTADDRESS).methods,
                    balance: 0,
                    config: config
                });
                return [2 /*return*/];
            });
        });
    };
    EVM.prototype.getFaucetUsage = function () {
        return 100 * (this.requestCount / MEMPOOL_LIMIT);
    };
    return EVM;
}());
exports["default"] = EVM;
