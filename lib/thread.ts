import {Worker, MessagePort, MessageChannel} from "worker_threads";
import path = require("path");
import {Action, MessageAction, MessageData, RunAction} from "./action";
import {EventDispatcher} from "@appolo/events";
import {Deferred} from "./deferred";
import {Events} from "./interfaces";

export class Thread extends EventDispatcher {

    private _port: MessagePort;
    private _initDeferred: Deferred<any>;

    private _isTerminated: boolean = false;
    private _isInitialized: boolean = false;

    private _worker: Worker;

    private _runningJobs: number = 0;

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

        this.fireEvent(Events.Error, e, this);

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
            case Action.RunFail:
                this._runningJobs--;
                this.fireEvent(Events.Run, (msg as RunAction));
                break;
            case Action.Message:
                this.fireEvent(Events.Message, (msg as MessageAction).data);
                break;
        }
    };

    public get runningJobs(): number {
        return this._runningJobs;
    }

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


    public run(id: string, data: any): void {
        this._runningJobs++;
        this._port.postMessage({action: Action.Run, id, data});
    }

    private _clean() {
        this._initDeferred = null;
    }

    public destroy() {
        try {
            this._runningJobs = 0;
            this._isTerminated = true;
            this.fireEvent(Events.Destroyed);

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
