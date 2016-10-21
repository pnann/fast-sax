/// <reference path="../../typings/index.d.ts" />
import chai = require("chai");
import expect = chai.expect;
import ExpectedCallback = require("../ExpectedCallback");

function ExpectText(expectedText: string): ExpectedCallback {
    return {
        name: "onText",
        onCall: (getText: () => string) => {
            expect(getText()).to.equal(expectedText);
        }
    }
}

export = ExpectText;
