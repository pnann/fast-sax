/// <reference path="../../typings/index.d.ts" />
import chai = require("chai");
import expect = chai.expect;
import ExpectedCallback = require("../ExpectedCallback");

function ExpectElementEnd(expectedElementName: string): ExpectedCallback {
    return {
        name: "onElementEnd",
        onCall: (elementName: string) => {
            expect(elementName).to.equal(expectedElementName);
        }
    }
}

export = ExpectElementEnd;
