import chai = require("chai");
const expect = chai.expect;

import sinon = require("sinon");
import sinonChai = require("sinon-chai");
chai.use(sinonChai);

import FastSax = require("../../src/FastSax");

describe("StartsWithPolyfill", () => {
    let originalStartsWith;

    before(function () {
        originalStartsWith = (String.prototype as any).startsWith;
        delete (String.prototype as any).startsWith;
    });

    it("should work without any attached events", () => {
        const parser = new FastSax();
        parser.onComment = sinon.spy((getText) => {
            expect(getText()).to.equal("simple");
        });

        parser.parse("<super><!--simple-->></super>");
        expect(parser.onComment).to.have.been.calledOnce;
    });

    after(function () {
        (String.prototype as any).startsWith = originalStartsWith;
    });
});
