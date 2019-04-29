import {EventDispatcher} from "appolo-event-dispatcher";
import {Thread} from "./thread";
import {Queue} from "./queue";
import _ = require("lodash");

export class Pool<T, K> extends EventDispatcher {

    private _threads: Thread[] = [];
    private _queue: Queue;

    constructor(private options: { path: string, threads: number, workerData?: any }) {

        super();

        this._queue = new Queue();
    }

    public async initialize(): Promise<this> {

        if (this.options.threads < 1) {
            throw new Error("thread threads must be above 1")
        }

        let promises = [];

        for (let i = 0; i < this.options.threads; i++) {
            promises.push(this._createThread());
        }

        await Promise.all(promises);

        return this;
    }

    public get numOfThreads() {
        return this._threads.length;
    }

    private async _createThread() {

        let thread = new Thread({path: this.options.path, workerData: this.options.workerData});

        thread.once("error", this._onError, this);

        await thread.initialize();

        this._threads.push(thread);
    }

    private _onError(e: Error, thread: Thread) {
        _.remove(this._threads, item => item === thread);

        this._createThread().catch(e => this.fireEvent("error", e));

        this.fireEvent("error", e);
    }

    private async _checkForJob() {
        if (!this._queue.length || !this._threads.length) {
            return;
        }

        let thread = this._threads.shift();

        let job = this._queue.pull();

        job.thread = thread;

        await job.run();

        if (!thread.isTerminated) {
            this._threads.push(thread)
        }

        this._checkForJob();
    }

    public run(data?: T): Promise<K> {

        let promise = this._queue.push(data);

        this._checkForJob();

        return promise;
    }

    public destroy() {
        setImmediate(() => {
            this._queue.destroy();

            _.forEach(this._threads, thread => thread.destroy());

            this._threads.length = 0;
        })
    }

}
