export enum Events {
    Destroyed = "destroyed",
    Error = "error",
    Run = "run",
    Message = "message",
    Finish = "finish",

}

export interface IOptions {
    path: string,
    threads: number,
    workerData?: any,
    maxThreadJobs?: number
}
