import {Worker} from "../../lib/worker";
export class Fibonacci extends Worker {
    async run(num: number) {
        let a = 1, b = 0, temp;

        while (num >= 0) {
            temp = a;
            a = a + b;
            b = temp;
            num--;
        }

        return b;
    }
}



