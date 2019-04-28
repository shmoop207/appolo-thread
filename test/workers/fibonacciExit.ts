import {Worker} from "../../lib/worker";

export class Fibonacci extends Worker {
    async run(num: number) {

        setTimeout(() => {
            process.exit(1)
        }, 5)

        return new Promise(resolve => setTimeout(resolve, 10));


    }
}

