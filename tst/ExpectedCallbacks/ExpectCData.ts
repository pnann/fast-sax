/// <reference path="../../typings/index.d.ts" />
import chai = require("chai");
import expect = chai.expect;
import ExpectedCallback = require("../ExpectedCallback");

function ExpectCData(expectedText: string): ExpectedCallback {
    return {
        name: "onCData",
        onCall: (getText: () => string) => {
            expect(getText()).to.equal(expectedText);
        }
    }
}

export = ExpectCData;
