export enum Action {
    Start,
    InitSuccess,
    InitFail,
    Run,
    RunSuccess,
    RunFail,
    Message
}


export type MessageData = { action: Action } & { [index: string]: any };
