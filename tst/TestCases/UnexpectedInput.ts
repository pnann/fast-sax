import runTest = require("../TestRunner");
import FastSax = require("../../src/FastSax");

describe("Unexpected input", () => {

    runTest({
        name: "empty angle brackets",
        input: "<>",
        expect: []
    });

    runTest({
        name: "empty input",
        input: "",
        expect: []
    });

    runTest({
        name: "random non-xml input",
        input: "blah blah random blah",
        expect: []
    });

    runTest({
        name: "Angle",
        input: "<",
        expect: []
    });

    runTest({
        name: "Angle incomplete",
        input: "< dfefe ",
        expect: []
    });

    runTest({
        name: "Angle closed",
        input: "</",
        expect: []
    });

    runTest({
        name: "Angle closed incomplete",
        input: "</ blahs",
        expect: []
    });

    runTest({
        name: "Angle exclamation point",
        input: "<!",
        expect: []
    });

    runTest({
        name: "start of comment",
        input: "<!--",
        expect: []
    });

    runTest({
        name: "comment without end",
        input: "<!-- blah blah",
        expect: []
    });

    it("should work without any attached events", () => {
        const parser = new FastSax();
        parser.parse("<super>simple</super>");
    });

});