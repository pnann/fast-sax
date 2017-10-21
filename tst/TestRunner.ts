import chai = require("chai");
const expect = chai.expect;

import sinon = require("sinon");
import sinonChai = require("sinon-chai");

import TestCase = require("./TestCase");
import FastSax = require("../src/FastSax");

chai.use(sinonChai);

function runTest(testCase: TestCase) {
    const parser = new FastSax();
    const allEventTypes = ["onCData", "onComment", "onElementStart", "onElementEnd", "onText"];

    it(testCase.name, () => {

        /*
         * Expected callbacks should be the only ones called, and they should be called in order. Any unexpected
         * callbacks, out of order callbacks, or expected but uncalled callbacks should result in a failure.
         */
        const callbackQueue = {};
        for (let expectedCallback of testCase.expect) {
            if (!callbackQueue[expectedCallback.name]) {
                callbackQueue[expectedCallback.name] = [];
                parser[expectedCallback.name] = (a, b) => {
                    callbackQueue[expectedCallback.name].shift()(a, b);
                };
            }

            expectedCallback.onCall = sinon.spy(expectedCallback.onCall);
            callbackQueue[expectedCallback.name].push(expectedCallback.onCall);
        }

        for (let name of allEventTypes) {
            if (!callbackQueue[name]) {
                parser[name] = () => {
                    throw new Error(`Unexpected call to '${name}'`)
                };
            }
        }

        parser.parse(testCase.input);

        for (let expected of testCase.expect) {
            expect(expected.onCall).to.be.calledOnce;
        }
    });
}

export = runTest;
