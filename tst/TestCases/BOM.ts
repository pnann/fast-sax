import runTest = require("../TestRunner");
import ExpectElementStart = require("../ExpectedCallbacks/ExpectElementStart");
import ExpectElementEnd = require("../ExpectedCallbacks/ExpectElementEnd");

describe("BOM", () => {
    runTest({
        name: "Ignores leading BOM",
        input: "\uFEFF<dimension></dimension>",
        expect: [
            ExpectElementStart("dimension"),
            ExpectElementEnd("dimension")
        ]
    });
});
