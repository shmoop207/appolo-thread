"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const appolo_event_dispatcher_1 = require("appolo-event-dispatcher");
const deferred_1 = require("./deferred");
const action_1 = require("./action");
const uuid = require("uuid");
const interfaces_1 = require("./interfaces");
class Job extends appolo_event_dispatcher_1.EventDispatcher {
    constructor(_data) {
        super();
        this._data = _data;
        this._id = uuid.v4();
    }
    inQueue() {
        this._deferred = new deferred_1.Deferred();
        return this._deferred.promise;
    }
    set thread(value) {
        this._thread = value;
    }
    async run() {
        this._thread.once(interfaces_1.Events.Error, this._destroy, this);
        this._thread.once(interfaces_1.Events.Destroyed, this._destroy, this);
        this._thread.on(interfaces_1.Events.Run, this._onRun, this);
        this._thread.run(this._id, this._data);
    }
    _onRun(msg) {
        if (!this._deferred || msg.id != this._id) {
            return;
        }
        (msg.action == action_1.Action.RunSuccess)
            ? this._deferred.resolve(msg.result)
            : this._deferred.reject(new Error(msg.error));
        this.fireEvent(interfaces_1.Events.Finish);
        this._clean();
    }
    _clean() {
        this._thread.removeListenersByScope(this);
        this.removeAllListeners();
        this._deferred = null;
        this._thread = null;
    }
    _destroy(e) {
        this._deferred && this._deferred.reject(e || new Error("job destroyed"));
        this._clean();
    }
    destroy() {
        this._destroy();
    }
}
exports.Job = Job;
//# sourceMappingURL=job.js.map