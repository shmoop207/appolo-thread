"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
const action_1 = require("./action");
const worker_1 = require("./worker");
const _ = require("lodash");
class Runner {
    constructor() {
        this._onMessage = (msg) => {
            switch (msg.action) {
                case action_1.Action.Start:
                    this._initPort(msg.port);
                    this._start(msg.path);
                    break;
                case action_1.Action.Run:
                    this._run(msg.id, msg.data);
                    break;
            }
        };
    }
    init() {
        worker_threads_1.parentPort.once('message', this._onMessage);
    }
    _initPort(port) {
        this._port = port;
        this._port.on('message', this._onMessage);
    }
    async _start(path) {
        try {
            let required = require(path);
            let WorkerCtr = _.find(required, (value) => worker_1.Worker.isPrototypeOf(value));
            if (!WorkerCtr) {
                throw new Error(`failed to find thread constructor at path ${path}`);
            }
            this._worker = new WorkerCtr(worker_threads_1.workerData, this._port);
            await this._worker.initialize();
            this._port.postMessage({ action: action_1.Action.InitSuccess });
        }
        catch (e) {
            this._port.postMessage({ action: action_1.Action.InitFail, error: e.stack });
        }
    }
    async _run(id, data) {
        try {
            let result = await this._worker.run(data);
            this._port.postMessage({ id, action: action_1.Action.RunSuccess, result });
        }
        catch (e) {
            this._port.postMessage({ id, action: action_1.Action.RunFail, error: e.stack });
        }
    }
}
let handler = new Runner();
handler.init();
//# sourceMappingURL=runner.js.map