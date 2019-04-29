"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const worker_1 = require("../../lib/worker");
class Fibonacci extends worker_1.Worker {
    async run(num) {
        let a = 1, b = 0, temp;
        while (num >= 0) {
            temp = a;
            a = a + b;
            b = temp;
            num--;
        }
        this.postMessage("working");
        return b;
    }
}
exports.Fibonacci = Fibonacci;
//# sourceMappingURL=fibonacci.js.map