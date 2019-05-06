export enum Action {
    Start,
    InitSuccess,
    InitFail,
    Run,
    RunSuccess,
    RunFail,
    Message
}




export type MessageData = { action: Action, id?: string } & { [index: string]: any };

export interface MessageAction {
    action: Action
    data: any
}


export interface RunAction {
    action: Action.RunFail | Action.RunSuccess
    id: string
    result?: any
    error?: any
}
