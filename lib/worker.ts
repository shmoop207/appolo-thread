export abstract class Worker {
    constructor(protected workerData: any) {
    }


    public async initialize(): Promise<void> {

    }

    public abstract run(data?: any): Promise<any>
}
