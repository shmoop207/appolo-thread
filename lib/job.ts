import {Worker} from 'worker_threads';
import {EventDispatcher, IEventOptions} from "appolo-event-dispatcher";
import {Thread} from "./thread";
import {Deferred} from "./deferred";

export class Job extends EventDispatcher {


    private _thread: Thread;

    private _deferred: Deferred<any>;

    constructor(private _data: any) {
        super();
    }

    public inQueue(): Promise<any> {

        this._deferred = new Deferred();

        return this._deferred.promise
    }

    public set thread(value: Thread) {
        this._thread = value;
    }

    public async run(): Promise<any> {

        try {
            let result = await this._thread.run(this._data);
            this._deferred.resolve(result)
        } catch (e) {
            this._deferred.reject(e);
        } finally {
            this._clean();
        }
    }

    private _clean() {
        this._deferred = null;
        this._thread = null;
    }

    public destroy() {
        this._deferred && this._deferred.reject(new Error("job destroyed"));
        this._clean();
    }

}
