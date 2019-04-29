import {Worker, MessagePort, MessageChannel} from "worker_threads";
import path = require("path");
import {Action, MessageData} from "./action";
import {EventDispatcher} from "appolo-event-dispatcher/lib/eventDispatcher";

export class Thread extends EventDispatcher {

    private _port: MessagePort;
    private _initResolve: () => void;
    private _initReject: (e: Error) => void;

    private _runResolve: (result: any) => void;
    private _runReject: (e: Error) => void;

    private _isRunning: boolean;
    private _isTerminated: boolean = false;
    private _isInitialized: boolean = false;

    private _worker: Worker;

    constructor(private options: { path: string, workerData: any }) {
        super();
    }

    public initialize() {
        return new Promise((resolve, reject) => {
            try {
                this._worker = new Worker(path.join(__dirname, "runner.js"), {workerData: this.options.workerData || {}});
                this._worker.once("exit", this._onExit);
                this._worker.once("error", this._onError);
                this._initResolve = resolve;
                this._initReject = reject;
                const {port1, port2} = new MessageChannel();

                this._port = port1;

                this._worker.postMessage({action: Action.Start, path: this.options.path, port: port2}, [port2]);

                this._port.on("message", this._onMessage)
            } catch (e) {
                reject(e);
            }
        })
    }

    private _onError = (e: Error) => {

        this._isTerminated = true;

        if (this._initReject) {
            this._initReject(e);
        }

        if (this._runReject) {
            this._runReject(e)
        }

        this.fireEvent('error', e, this);

        this.destroy();
    };

    private _onExit = (code: number) => {
        this._onError(new Error(`Worker has stopped with code ${code}`));
    };

    private _onMessage = (data: MessageData) => {
        switch (data.action) {
            case Action.InitSuccess:
                this._onInitSuccess(data);
                break;
            case Action.InitFail:
                this._onInitFail(data);
                break;
            case Action.RunSuccess:
                this._onRunSuccess(data);
                break;
            case Action.RunFail:
                this._onRunFail(data);
                break;
        }
    };

    public get isTerminated(): boolean {
        return this._isTerminated
    }

    private _onInitSuccess(data: MessageData) {
        if (this._initResolve) {
            this._isInitialized = true;
            this._initResolve();
            this._clean();
        }
    }

    private _onInitFail(data: MessageData) {
        if (this._initReject) {
            this._initReject(new Error(data.error));
            this._clean();
        }
    }

    private _onRunSuccess(data: MessageData) {
        if (this._runResolve) {
            this._runResolve(data.result);
            this._clean();
        }
    }

    private _onRunFail(data: MessageData) {
        if (this._runReject) {
            this._runReject(new Error(data.error));
            this._clean();
        }
    }

    public run(data: any) {
        return new Promise((resolve, reject) => {
            this._isRunning = true;
            this._runResolve = resolve;
            this._runReject = reject;
            this._port.postMessage({action: Action.Run, data})
        })
    }

    private _clean() {
        this._initReject = null;
        this._initResolve = null;
        this._runReject = null;
        this._runResolve = null;
        this._runReject = null;
        this._isRunning = false;
    }

    public destroy() {
        try {
            this._isTerminated = true;
            this._runReject && this._runReject(new Error("worker destroyed"));

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
