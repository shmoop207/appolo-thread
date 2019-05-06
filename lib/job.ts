import {EventDispatcher} from "appolo-event-dispatcher";
import {Thread} from "./thread";
import {Deferred} from "./deferred";
import {Action, RunAction} from "./action";
import uuid = require('uuid');
import {Events} from "./interfaces";

export class Job extends EventDispatcher {

    private _thread: Thread;

    private _deferred: Deferred<any>;

    private readonly _id: string;

    constructor(private _data: any) {
        super();

        this._id = uuid.v4();
    }

    public inQueue(): Promise<any> {

        this._deferred = new Deferred();

        return this._deferred.promise
    }

    public set thread(value: Thread) {
        this._thread = value;
    }

    public async run(): Promise<any> {

        this._thread.once(Events.Error, this._destroy, this);
        this._thread.once(Events.Destroyed, this._destroy, this);
        this._thread.on(Events.Run, this._onRun, this);

        this._thread.run(this._id, this._data);

    }

    private _onRun(msg: RunAction) {
        if (!this._deferred || msg.id != this._id) {
            return;
        }

        (msg.action == Action.RunSuccess)
            ? this._deferred.resolve(msg.result)
            : this._deferred.reject(new Error(msg.error));

        this.fireEvent(Events.Finish);

        this._clean();
    }

    private _clean() {
        this._thread.removeListenersByScope(this);
        this.removeAllListeners();
        this._deferred = null;
        this._thread = null;
    }

    private _destroy(e?: Error) {
        this._deferred && this._deferred.reject(e || new Error("job destroyed"));
        this._clean();
    }

    public destroy() {
        this._destroy();
    }

}
