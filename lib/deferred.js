"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Deferred {
    constructor() {
        this._resolve = null;
        this._reject = null;
        this._promise = null;
        this._promise = new Promise((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;
        });
    }
    get promise() {
        return this._promise;
    }
    get reject() {
        return this._reject;
    }
    get resolve() {
        return this._resolve;
    }
}
exports.Deferred = Deferred;
//# sourceMappingURL=deferred.js.map