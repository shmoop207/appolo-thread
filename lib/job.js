"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const appolo_event_dispatcher_1 = require("appolo-event-dispatcher");
const deferred_1 = require("./deferred");
class Job extends appolo_event_dispatcher_1.EventDispatcher {
    constructor(_data) {
        super();
        this._data = _data;
    }
    inQueue() {
        this._deferred = new deferred_1.Deferred();
        return this._deferred.promise;
    }
    set thread(value) {
        this._thread = value;
    }
    async run() {
        try {
            let result = await this._thread.run(this._data);
            this._deferred.resolve(result);
        }
        catch (e) {
            this._deferred.reject(e);
        }
        finally {
            this._clean();
        }
    }
    _clean() {
        this._deferred = null;
        this._thread = null;
    }
    destroy() {
        this._deferred && this._deferred.reject(new Error("job destroyed"));
        this._clean();
    }
}
exports.Job = Job;
//# sourceMappingURL=job.js.map