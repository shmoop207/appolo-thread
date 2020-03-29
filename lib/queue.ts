import {Job} from "./job";

export class Queue {
    private _jobs: Job[] = [];

    public push(data: any): Promise<any> {
        let job = new Job(data);

        this._jobs.push(job);

        return job.inQueue();
    }

    public get length(): number {
        return this._jobs.length
    }

    public shift() {
        return this._jobs.shift();
    }

    public destroy() {
        (this._jobs || []).forEach(job => job.destroy());
        this._jobs.length = 0;

    }

}
