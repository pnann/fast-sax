/// <reference path="../../typings/index.d.ts" />
import chai = require("chai");
import expect = chai.expect;
import ExpectedCallback = require("../ExpectedCallback");

function ExpectElementStart(expectedElementName: string, expectedAttributes?: {[attribute: string]: string}): ExpectedCallback {
    return {
        name: "onElementStart",
        onCall: (elementName: string, getAttributes: () => {[attribute: string]: string}) => {
            expect(elementName).to.equal(expectedElementName);

            if (expectedAttributes) {
                const attributes = getAttributes();
                for (var attribute in expectedAttributes) {
                    if (expectedAttributes.hasOwnProperty(attribute)) {
                        expect(attributes[attribute]).to.equal(expectedAttributes[attribute]);
                    }
                }
            }
        }
    }
}

export = ExpectElementStart;
