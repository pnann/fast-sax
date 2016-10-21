/// <reference path="../../typings/index.d.ts" />
import chai = require("chai");
import expect = chai.expect;
import ExpectedCallback = require("../ExpectedCallback");

function ExpectComment(expectedText: string): ExpectedCallback {
    return {
        name: "onComment",
        onCall: (getText: () => string) => {
            expect(getText()).to.equal(expectedText);
        }
    }
}

export = ExpectComment;
