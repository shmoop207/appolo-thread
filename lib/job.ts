import {Worker} from 'worker_threads';
import {EventDispatcher, IEventOptions} from "appolo-event-dispatcher";
import {Thread} from "./thread";

export class Job extends EventDispatcher {


    private _thread: Thread;

    private _resolve: (result: any) => void;
    private _reject: (e: Error) => void;

    constructor(private _data: any) {
        super();
    }

    public inQueue() {
        return new Promise((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;
        })
    }

    public set thread(value: Thread) {
        this._thread = value;
    }

    public async run(): Promise<any> {

        try {
            let result = await this._thread.run(this._data);
            this._resolve(result)
        } catch (e) {
            this._reject(e);
        } finally {
            this._clean();
        }
    }

    private _clean() {
        this._resolve = null;
        this._reject = null;
        this._thread = null;
    }

    public destory() {
        this._reject && this._reject(new Error("job destroyed"));
        this._clean();
    }

}
