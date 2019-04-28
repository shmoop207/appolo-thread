"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const appolo_event_dispatcher_1 = require("appolo-event-dispatcher");
class Job extends appolo_event_dispatcher_1.EventDispatcher {
    constructor(_data) {
        super();
        this._data = _data;
    }
    inQueue() {
        return new Promise((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;
        });
    }
    set thread(value) {
        this._thread = value;
    }
    async run() {
        try {
            let result = await this._thread.run(this._data);
            this._resolve(result);
        }
        catch (e) {
            this._reject(e);
        }
        finally {
            this._clean();
        }
    }
    _clean() {
        this._resolve = null;
        this._reject = null;
        this._thread = null;
    }
    destory() {
        this._reject && this._reject(new Error("job destroyed"));
        this._clean();
    }
}
exports.Job = Job;
//# sourceMappingURL=job.js.map