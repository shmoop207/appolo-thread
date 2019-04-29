"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
const path = require("path");
const action_1 = require("./action");
const eventDispatcher_1 = require("appolo-event-dispatcher/lib/eventDispatcher");
class Thread extends eventDispatcher_1.EventDispatcher {
    constructor(options) {
        super();
        this.options = options;
        this._isTerminated = false;
        this._isInitialized = false;
        this._onError = (e) => {
            this._isTerminated = true;
            if (this._initReject) {
                this._initReject(e);
            }
            if (this._runReject) {
                this._runReject(e);
            }
            this.fireEvent('error', e, this);
            this.destroy();
        };
        this._onExit = (code) => {
            this._onError(new Error(`Worker has stopped with code ${code}`));
        };
        this._onMessage = (data) => {
            switch (data.action) {
                case action_1.Action.InitSuccess:
                    this._onInitSuccess(data);
                    break;
                case action_1.Action.InitFail:
                    this._onInitFail(data);
                    break;
                case action_1.Action.RunSuccess:
                    this._onRunSuccess(data);
                    break;
                case action_1.Action.RunFail:
                    this._onRunFail(data);
                    break;
            }
        };
    }
    initialize() {
        return new Promise((resolve, reject) => {
            try {
                this._worker = new worker_threads_1.Worker(path.join(__dirname, "runner.js"), { workerData: this.options.workerData || {} });
                this._worker.once("exit", this._onExit);
                this._worker.once("error", this._onError);
                this._initResolve = resolve;
                this._initReject = reject;
                const { port1, port2 } = new worker_threads_1.MessageChannel();
                this._port = port1;
                this._worker.postMessage({ action: action_1.Action.Start, path: this.options.path, port: port2 }, [port2]);
                this._port.on("message", this._onMessage);
            }
            catch (e) {
                reject(e);
            }
        });
    }
    get isTerminated() {
        return this._isTerminated;
    }
    _onInitSuccess(data) {
        if (this._initResolve) {
            this._isInitialized = true;
            this._initResolve();
            this._clean();
        }
    }
    _onInitFail(data) {
        if (this._initReject) {
            this._initReject(new Error(data.error));
            this._clean();
        }
    }
    _onRunSuccess(data) {
        if (this._runResolve) {
            this._runResolve(data.result);
            this._clean();
        }
    }
    _onRunFail(data) {
        if (this._runReject) {
            this._runReject(new Error(data.error));
            this._clean();
        }
    }
    run(data) {
        return new Promise((resolve, reject) => {
            this._isRunning = true;
            this._runResolve = resolve;
            this._runReject = reject;
            this._port.postMessage({ action: action_1.Action.Run, data });
        });
    }
    _clean() {
        this._initReject = null;
        this._initResolve = null;
        this._runReject = null;
        this._runResolve = null;
        this._runReject = null;
        this._isRunning = false;
    }
    destroy() {
        try {
            this._isTerminated = true;
            this._runReject && this._runReject(new Error("worker destroyed"));
            this._clean();
            this.removeAllListeners();
            this._worker.removeAllListeners();
            this._port.removeAllListeners();
            this._port.close();
            this._worker.terminate();
            this._worker = null;
            this._port = null;
        }
        catch (e) {
        }
    }
}
exports.Thread = Thread;
//# sourceMappingURL=thread.js.map