import {MessagePort} from "worker_threads";
import {Action} from "./action";

export abstract class Worker {
    constructor(protected workerData: any, protected port: MessagePort) {
    }

    public async initialize(): Promise<void> {

    }

    public abstract run(data?: any): Promise<any>

    public postMessage(data: any) {
        this.port.postMessage({action: Action.Message, data})
    }
}
