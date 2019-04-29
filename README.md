# Appolo Thread
[![Build Status](https://travis-ci.org/shmoop207/appolo-thread.svg?branch=master)](https://travis-ci.org/shmoop207/appolo-thread) [![Dependencies status](https://david-dm.org/shmoop207/appolo-thread.svg)](https://david-dm.org/shmoop207/appolo-thread) [![NPM version](https://badge.fury.io/js/appolo-thread.svg)](https://badge.fury.io/js/appolo-thread)  [![npm Downloads](https://img.shields.io/npm/dm/appolo-thread.svg?style=flat)](https://www.npmjs.com/package/appolo-thread)
[![Known Vulnerabilities](https://snyk.io/test/github/shmoop207/appolo-thread/badge.svg)](https://snyk.io/test/github/shmoop207/appolo-thread)

Thread Pool using node [worker_threads](https://nodejs.org/api/worker_threads.html)
## Installation

```javascript
npm install appolo-thread --save
```

## Usage
```typescript
import { Pool } from 'appolo-thread';

async function test() {
    const pool = new Pool({
        path:'./workers/fibonacci.js', 
        threads: 2
    });
  
    await pool.initialize();
   
    let result = await pool.run(50);
}
```

worker class, must inherit Worker

```typescript
import { Worker } from 'appolo-thread';
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

```

## Api
### Pool options:

- `path` - path to worker class
- `threads` - number of threads to run
- `workerData` - custom worker data object will be passed to worker constructor

```javascript

const pool = new Pool({
    path:'./workers/fibonacci.js', 
    threads: 2,
    workerData :{some:"value"}
});

```

### Initialize
initialize the pool return promise when completed
```javascript
const pool = new Pool({
    path:'./workers/fibonacci.js', 
    threads: 2,
});

await pool.initialize();

```

you can also implement worker initialize method.\
the method will be called on pool `initialize`
```typescript
import { Worker } from 'appolo-thread';
export class Fibonacci extends Worker {
    
    async initialize(){
        //do something
    }
    
    async run(num: number) {
        //...
    }
}

```

### Run
run worker with custom params.
return promise with the worker result

```javascript
const pool = new Pool({
    path:'./workers/fibonacci.js', 
    threads: 2,
});

await pool.initialize();

let reuslt = await pool.run({some:"value"})
```

### Message event
The `message` event is emitted from the worker using the worker `postMessage` method

```javascript
const pool = new Pool({
    path:'./workers/fibonacci.js', 
    threads: 2,
});

await pool.initialize();

pool.on("message",function(data) {
   console.log(data) // some message
})

```
post message in worker class
```typescript
import { Worker } from 'appolo-thread';
export class Fibonacci extends Worker {
    
    async initialize(){
       this.postMessage("some message")
    }
    
    async run(num: number) {
        //...
    }
}

```
### Uncaught event
The `error` event is emitted if the worker thread throws an uncaught exception.
```javascript
const pool = new Pool({
    path:'./workers/fibonacci.js', 
    threads: 2,
});

await pool.initialize();

pool.on("error",function(e) {
   console.log(e) 
})
````


## License
MIT
