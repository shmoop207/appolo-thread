"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Fibonacci = void 0;
const worker_1 = require("../../lib/worker");
class Fibonacci extends worker_1.Worker {
    async run(num) {
        setTimeout(() => {
            process.exit(1);
        }, 5);
        return new Promise(resolve => setTimeout(resolve, 10));
    }
}
exports.Fibonacci = Fibonacci;
//# sourceMappingURL=fibonacciExit.js.map