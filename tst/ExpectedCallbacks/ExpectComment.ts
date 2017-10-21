import chai = require("chai");
const expect = chai.expect;

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
