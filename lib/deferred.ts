export class Deferred<T> {

    private _resolve: (value?: T) => void = null;

    private _reject: (e?: Error) => void = null;

    private readonly _promise: Promise<T> = null;


    constructor() {
        this._promise = new Promise<T>((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject
        })
    }

    public get promise(): Promise<T> {
        return this._promise;
    }

    public get reject(): (e?: Error) => void {
        return this._reject;
    }

    public get resolve(): (value?: T) => void {
        return this._resolve;
    }

}
