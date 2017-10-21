import runTest = require("../TestRunner");
import ExpectElementStart = require("../ExpectedCallbacks/ExpectElementStart");
import ExpectElementEnd = require("../ExpectedCallbacks/ExpectElementEnd");
import ExpectText = require("../ExpectedCallbacks/ExpectText");

describe("Multiple elements", () => {

    runTest({
        name: "Multiple elements",
        input: "<dimension></dimension><random></random>",
        expect: [
            ExpectElementStart("dimension"),
            ExpectElementEnd("dimension"),
            ExpectElementStart("random"),
            ExpectElementEnd("random")
        ]
    });

    runTest({
        name: "Multiple elements with text",
        input: "<dimension>blah</dimension><random>super blah</random>",
        expect: [
            ExpectElementStart("dimension"),
            ExpectText("blah"),
            ExpectElementEnd("dimension"),
            ExpectElementStart("random"),
            ExpectText("super blah"),
            ExpectElementEnd("random")
        ]
    });
    
    runTest({
        name: "Multiple nested elements",
        input: "<dimension><yep definitely='blah'/></dimension><random>super blah</random>",
        expect: [
            ExpectElementStart("dimension"),
            ExpectElementStart("yep", {"definitely": "blah"}),
            ExpectElementEnd("yep"),
            ExpectElementEnd("dimension"),
            ExpectElementStart("random"),
            ExpectText("super blah"),
            ExpectElementEnd("random")
        ]
    });

});
