export enum Action {
    Start,
    InitSuccess,
    InitFail,
    Run,
    RunSuccess,
    RunFail
}


export type MessageData = { action: Action } & { [index: string]: any };
