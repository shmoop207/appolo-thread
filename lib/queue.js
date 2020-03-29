"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const job_1 = require("./job");
class Queue {
    constructor() {
        this._jobs = [];
    }
    push(data) {
        let job = new job_1.Job(data);
        this._jobs.push(job);
        return job.inQueue();
    }
    get length() {
        return this._jobs.length;
    }
    shift() {
        return this._jobs.shift();
    }
    destroy() {
        (this._jobs || []).forEach(job => job.destroy());
        this._jobs.length = 0;
    }
}
exports.Queue = Queue;
//# sourceMappingURL=queue.js.map