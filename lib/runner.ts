import {parentPort, MessagePort, workerData} from "worker_threads";
import {Action, MessageData} from "./action";
import {Worker} from "./worker";
import * as _ from "lodash";

class Runner {

    private _port: MessagePort;
    private _worker: Worker;

    public init() {
        parentPort.once('message', this._onMessage)
    }

    private _initPort(port: MessagePort) {
        this._port = port;
        this._port.on('message', this._onMessage)

    }

    private async _start(path: string) {
        try {

            let required = require(path);

            let WorkerCtr = _.find<(new(workerData: any) => Worker)>(required, (value) => Worker.isPrototypeOf(value));

            if (!WorkerCtr) {
                throw new Error(`failed to find thread constructor at path ${path}`)
            }

            this._worker = new WorkerCtr(workerData);

            await this._worker.initialize();

            this._port.postMessage({action: Action.InitSuccess});


        } catch (e) {
            this._port.postMessage({action: Action.InitFail, error: e.stack});
        }
    }

    private async _run(data: any) {
        try {

            let result = await this._worker.run(data);

            this._port.postMessage({action: Action.RunSuccess, result});

        } catch (e) {
            this._port.postMessage({action: Action.RunFail, error: e.stack});
        }
    }


    private _onMessage = (msg: MessageData) => {
        switch (msg.action) {
            case Action.Start:
                this._initPort(msg.port);
                this._start(msg.path);
                break;

            case Action.Run:
                this._run(msg.data);
                break;
        }
    }
}


let handler = new Runner();

handler.init();


