import chai = require("chai");
const expect = chai.expect;

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
