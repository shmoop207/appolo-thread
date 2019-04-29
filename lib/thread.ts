import {Worker, MessagePort, MessageChannel} from "worker_threads";
import path = require("path");
import {Action, MessageData} from "./action";
import {EventDispatcher} from "appolo-event-dispatcher/lib/eventDispatcher";
import {Deferred} from "./deferred";

export class Thread extends EventDispatcher {

    private _port: MessagePort;
    private _initDeferred: Deferred<any>;

    private _runDeferred: Deferred<any>;

    private _isRunning: boolean;
    private _isTerminated: boolean = false;
    private _isInitialized: boolean = false;

    private _worker: Worker;

    constructor(private options: { path: string, workerData: any }) {
        super();
    }

    public initialize(): Promise<any> {

        this._initDeferred = new Deferred();

        try {
            this._worker = new Worker(path.join(__dirname, "runner.js"), {workerData: this.options.workerData || {}});
            this._worker.once("exit", this._onExit);
            this._worker.once("error", this._onError);
            const {port1, port2} = new MessageChannel();

            this._port = port1;

            this._worker.postMessage({action: Action.Start, path: this.options.path, port: port2}, [port2]);

            this._port.on("message", this._onMessage);

        } catch (e) {
            this._initDeferred.reject();
        }

        return this._initDeferred.promise;

    }

    private _onError = (e: Error) => {

        this._isTerminated = true;

        if (this._initDeferred) {
            this._initDeferred.reject(e);
        }

        if (this._runDeferred) {
            this._runDeferred.reject(e)
        }

        this.fireEvent('error', e, this);

        this.destroy();
    };

    private _onExit = (code: number) => {
        this._onError(new Error(`Worker has stopped with code ${code}`));
    };

    private _onMessage = (msg: MessageData) => {
        switch (msg.action) {
            case Action.InitSuccess:
                this._onInitSuccess(msg);
                break;
            case Action.InitFail:
                this._onInitFail(msg);
                break;
            case Action.RunSuccess:
                this._onRunSuccess(msg);
                break;
            case Action.RunFail:
                this._onRunFail(msg);
                break;

            case Action.Message:
                this.fireEvent("message", msg.data);
                break;
        }
    };

    public get isTerminated(): boolean {
        return this._isTerminated
    }

    private _onInitSuccess(data: MessageData) {
        if (!this._initDeferred) {
            return;
        }

        this._isInitialized = true;
        this._initDeferred.resolve();
        this._clean();

    }

    private _onInitFail(data: MessageData) {
        if (!this._initDeferred) {
            return;
        }

        this._initDeferred.reject(new Error(data.error));
        this._clean();

    }

    private _onRunSuccess(data: MessageData) {
        if (!this._runDeferred) {
            return;
        }

        this._runDeferred.resolve(data.result);
        this._clean();

    }

    private _onRunFail(data: MessageData) {
        if (!this._runDeferred) {
            return;
        }

        this._runDeferred.reject(new Error(data.error));
        this._clean();

    }

    public run(data: any): Promise<any> {
        this._runDeferred = new Deferred();

        this._port.postMessage({action: Action.Run, data});

        return this._runDeferred.promise;
    }

    private _clean() {
        this._initDeferred = null;
        this._runDeferred = null;
        this._isRunning = false;
    }

    public destroy() {
        try {
            this._isTerminated = true;
            this._runDeferred && this._runDeferred.reject(new Error("worker destroyed"));

            this._clean();
            this.removeAllListeners();
            this._worker.removeAllListeners();
            this._port.removeAllListeners();
            this._port.close();
            this._worker.terminate();


            this._worker = null;
            this._port = null;
        } catch (e) {

        }
    }
}
