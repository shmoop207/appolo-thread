import {EventDispatcher} from "appolo-event-dispatcher";
import {Thread} from "./thread";
import {Queue} from "./queue";
import {Events, IOptions} from "./interfaces";
import {Objects, Arrays} from "appolo-utils";

export class Pool<T, K> extends EventDispatcher {

    private _threads: Thread[] = [];
    private _queue: Queue;

    constructor(private readonly options: IOptions) {

        super();

        this.options = Objects.defaults<IOptions>(this.options, {maxThreadJobs: Number.MAX_SAFE_INTEGER});

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

        thread.once(Events.Error, this._onError, this);
        thread.bubble(Events.Message, this);

        await thread.initialize();

        this._threads.push(thread);
    }

    private _onError(e: Error, thread: Thread) {
        Arrays.removeBy(this._threads, item => item === thread);

        this._createThread().catch(e => this.fireEvent(Events.Error, e));

        this.fireEvent(Events.Error, e);
    }

    private async _checkForJob() {
        if (!this._queue.length || !this._threads.length) {
            return;
        }


        let threads = Arrays.sortBy(this._threads, (thread) => thread.runningJobs);

        let thread = threads[0];

        if (thread.runningJobs > this.options.maxThreadJobs) {
            return;
        }

        let job = this._queue.shift();

        job.thread = thread;

        await job.run();

        this._checkForJob();
    }

    public run(data?: T): Promise<K> {

        let promise = this._queue.push(data);

        this._checkForJob();

        return promise;
    }

    public destroy() {
        this.removeAllListeners();
        setImmediate(() => {
            this._queue.destroy();

            this._threads.forEach(thread => thread.destroy());

            this._threads.length = 0;
        })
    }

}
