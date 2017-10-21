import chai = require("chai");
const expect = chai.expect;

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
