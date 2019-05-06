"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const appolo_event_dispatcher_1 = require("appolo-event-dispatcher");
const thread_1 = require("./thread");
const queue_1 = require("./queue");
const _ = require("lodash");
const interfaces_1 = require("./interfaces");
class Pool extends appolo_event_dispatcher_1.EventDispatcher {
    constructor(options) {
        super();
        this.options = options;
        this._threads = [];
        this.options = _.defaults(this.options, { maxThreadJobs: Number.MAX_SAFE_INTEGER });
        this._queue = new queue_1.Queue();
    }
    async initialize() {
        if (this.options.threads < 1) {
            throw new Error("thread threads must be above 1");
        }
        let promises = [];
        for (let i = 0; i < this.options.threads; i++) {
            promises.push(this._createThread());
        }
        await Promise.all(promises);
        return this;
    }
    get numOfThreads() {
        return this._threads.length;
    }
    async _createThread() {
        let thread = new thread_1.Thread({ path: this.options.path, workerData: this.options.workerData });
        thread.once(interfaces_1.Events.Error, this._onError, this);
        thread.bubble(interfaces_1.Events.Message, this);
        await thread.initialize();
        this._threads.push(thread);
    }
    _onError(e, thread) {
        _.remove(this._threads, item => item === thread);
        this._createThread().catch(e => this.fireEvent(interfaces_1.Events.Error, e));
        this.fireEvent(interfaces_1.Events.Error, e);
    }
    async _checkForJob() {
        if (!this._queue.length || !this._threads.length) {
            return;
        }
        let threads = _.sortBy(this._threads, (thread) => thread.runningJobs);
        let thread = threads[0];
        if (thread.runningJobs > this.options.maxThreadJobs) {
            return;
        }
        let job = this._queue.shift();
        job.thread = thread;
        await job.run();
        this._checkForJob();
    }
    run(data) {
        let promise = this._queue.push(data);
        this._checkForJob();
        return promise;
    }
    destroy() {
        this.removeAllListeners();
        setImmediate(() => {
            this._queue.destroy();
            _.forEach(this._threads, thread => thread.destroy());
            this._threads.length = 0;
        });
    }
}
exports.Pool = Pool;
//# sourceMappingURL=pool.js.map