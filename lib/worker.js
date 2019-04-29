"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const action_1 = require("./action");
class Worker {
    constructor(workerData, port) {
        this.workerData = workerData;
        this.port = port;
    }
    async initialize() {
    }
    postMessage(data) {
        this.port.postMessage({ action: action_1.Action.Message, data });
    }
}
exports.Worker = Worker;
//# sourceMappingURL=worker.js.map