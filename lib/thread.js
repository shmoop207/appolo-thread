"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
const path = require("path");
const action_1 = require("./action");
const eventDispatcher_1 = require("appolo-event-dispatcher/lib/eventDispatcher");
const deferred_1 = require("./deferred");
class Thread extends eventDispatcher_1.EventDispatcher {
    constructor(options) {
        super();
        this.options = options;
        this._isTerminated = false;
        this._isInitialized = false;
        this._onError = (e) => {
            this._isTerminated = true;
            if (this._initDeferred) {
                this._initDeferred.reject(e);
            }
            if (this._runDeferred) {
                this._runDeferred.reject(e);
            }
            this.fireEvent('error', e, this);
            this.destroy();
        };
        this._onExit = (code) => {
            this._onError(new Error(`Worker has stopped with code ${code}`));
        };
        this._onMessage = (msg) => {
            switch (msg.action) {
                case action_1.Action.InitSuccess:
                    this._onInitSuccess(msg);
                    break;
                case action_1.Action.InitFail:
                    this._onInitFail(msg);
                    break;
                case action_1.Action.RunSuccess:
                    this._onRunSuccess(msg);
                    break;
                case action_1.Action.RunFail:
                    this._onRunFail(msg);
                    break;
                case action_1.Action.Message:
                    this.fireEvent("message", msg.data);
                    break;
            }
        };
    }
    initialize() {
        this._initDeferred = new deferred_1.Deferred();
        try {
            this._worker = new worker_threads_1.Worker(path.join(__dirname, "runner.js"), { workerData: this.options.workerData || {} });
            this._worker.once("exit", this._onExit);
            this._worker.once("error", this._onError);
            const { port1, port2 } = new worker_threads_1.MessageChannel();
            this._port = port1;
            this._worker.postMessage({ action: action_1.Action.Start, path: this.options.path, port: port2 }, [port2]);
            this._port.on("message", this._onMessage);
        }
        catch (e) {
            this._initDeferred.reject();
        }
        return this._initDeferred.promise;
    }
    get isTerminated() {
        return this._isTerminated;
    }
    _onInitSuccess(data) {
        if (!this._initDeferred) {
            return;
        }
        this._isInitialized = true;
        this._initDeferred.resolve();
        this._clean();
    }
    _onInitFail(data) {
        if (!this._initDeferred) {
            return;
        }
        this._initDeferred.reject(new Error(data.error));
        this._clean();
    }
    _onRunSuccess(data) {
        if (!this._runDeferred) {
            return;
        }
        this._runDeferred.resolve(data.result);
        this._clean();
    }
    _onRunFail(data) {
        if (!this._runDeferred) {
            return;
        }
        this._runDeferred.reject(new Error(data.error));
        this._clean();
    }
    run(data) {
        this._runDeferred = new deferred_1.Deferred();
        this._port.postMessage({ action: action_1.Action.Run, data });
        return this._runDeferred.promise;
    }
    _clean() {
        this._initDeferred = null;
        this._runDeferred = null;
        this._isRunning = false;
    }
    destroy() {
        try {
            this._isTerminated = true;
            this._runDeferred && this._runDeferred.reject(new Error("worker destroyed"));
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