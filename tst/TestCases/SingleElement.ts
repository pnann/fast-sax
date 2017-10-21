import runTest = require("../TestRunner");
import ExpectElementStart = require("../ExpectedCallbacks/ExpectElementStart");
import ExpectElementEnd = require("../ExpectedCallbacks/ExpectElementEnd");

describe("Single elements", () => {

    runTest({
        name: "Single element",
        input: "<dimension></dimension>",
        expect: [
            ExpectElementStart("dimension"),
            ExpectElementEnd("dimension")
        ]
    });

    runTest({
        name: "Single element, self closing",
        input: "<dimension/>",
        expect: [
            ExpectElementStart("dimension"),
            ExpectElementEnd("dimension")
        ]
    });

});
