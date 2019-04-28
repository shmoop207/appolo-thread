"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai = require("chai");
const path = require("path");
const index_1 = require("../index");
const sinon = require("sinon");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);
let should = chai.should();
describe("Pool", function () {
    it('should call thread', async () => {
        const pool = new index_1.Pool({ path: path.join(__dirname, './workers/fibonacci.js'), threads: 1 });
        await pool.initialize();
        let result = await pool.run(50);
        result.should.be.eq(20365011074);
        let result2 = await pool.run(25);
        result2.should.be.eq(121393);
        pool.destory();
    });
    it('should call multi thread', async () => {
        const pool = new index_1.Pool({ path: path.join(__dirname, './workers/fibonacci.js'), threads: 2 });
        await pool.initialize();
        let [result1, result2] = await Promise.all([pool.run(50), pool.run(30)]);
        result1.should.be.eq(20365011074);
        result2.should.be.eq(1346269);
        pool.destory();
    });
    it('should call multi thread above limit', async () => {
        const pool = new index_1.Pool({ path: path.join(__dirname, './workers/fibonacci.js'), threads: 2 });
        await pool.initialize();
        let [result1, result2, result3] = await Promise.all([pool.run(50), pool.run(30), pool.run(5)]);
        result1.should.be.eq(20365011074);
        result2.should.be.eq(1346269);
        result3.should.be.eq(8);
        pool.destory();
    });
    it('should call thread and throw error', async () => {
        const pool = new index_1.Pool({ path: path.join(__dirname, './workers/fibonacciError.js'), threads: 1 });
        await pool.initialize();
        try {
            let result = await pool.run(50);
        }
        catch (e) {
            e.message.should.include("Error: test");
        }
        pool.destory();
    });
    it('should call thread and exit thread', async () => {
        const pool = new index_1.Pool({ path: path.join(__dirname, './workers/fibonacciExit.js'), threads: 1 });
        await pool.initialize();
        let spy = sinon.spy();
        pool.on("error", spy);
        try {
            let result = await pool.run(50);
        }
        catch (e) {
            pool.numOfThreads.should.be.eq(0);
            e.message.should.be.eq("Worker has stopped with code 1");
            await new Promise(resolve => setTimeout(resolve, 100));
            spy.should.have.been.called;
            pool.numOfThreads.should.be.eq(1);
        }
        pool.destory();
    });
});
//# sourceMappingURL=unit.js.map