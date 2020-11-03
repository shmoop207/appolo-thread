"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Fibonacci = void 0;
const worker_1 = require("../../lib/worker");
class Fibonacci extends worker_1.Worker {
    async run(num) {
        throw new Error("test");
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
exports.Fibonacci = Fibonacci;
//# sourceMappingURL=fibonacciError.js.map