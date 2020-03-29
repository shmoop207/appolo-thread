"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
const path = require("path");
const action_1 = require("./action");
const appolo_event_dispatcher_1 = require("appolo-event-dispatcher");
const deferred_1 = require("./deferred");
const interfaces_1 = require("./interfaces");
class Thread extends appolo_event_dispatcher_1.EventDispatcher {
    constructor(options) {
        super();
        this.options = options;
        this._isTerminated = false;
        this._isInitialized = false;
        this._runningJobs = 0;
        this._onError = (e) => {
            this._isTerminated = true;
            if (this._initDeferred) {
                this._initDeferred.reject(e);
            }
            this.fireEvent(interfaces_1.Events.Error, e, this);
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
                case action_1.Action.RunFail:
                    this._runningJobs--;
                    this.fireEvent(interfaces_1.Events.Run, msg);
                    break;
                case action_1.Action.Message:
                    this.fireEvent(interfaces_1.Events.Message, msg.data);
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
    get runningJobs() {
        return this._runningJobs;
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
    run(id, data) {
        this._runningJobs++;
        this._port.postMessage({ action: action_1.Action.Run, id, data });
    }
    _clean() {
        this._initDeferred = null;
    }
    destroy() {
        try {
            this._runningJobs = 0;
            this._isTerminated = true;
            this.fireEvent(interfaces_1.Events.Destroyed);
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