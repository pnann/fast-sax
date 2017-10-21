import runTest = require("../TestRunner");
import ExpectElementStart = require("../ExpectedCallbacks/ExpectElementStart");
import ExpectElementEnd = require("../ExpectedCallbacks/ExpectElementEnd");

describe("Single elements, multiple attributes", () => {

    runTest({
        name: "Single element, multiple attributes",
        input: "<resolution height='1080' width='1920'></resolution>",
        expect: [
            ExpectElementStart("resolution", {"height": "1080", "width": "1920"}),
            ExpectElementEnd("resolution")
        ]
    });

    runTest({
        name: "Single element, multiple attributes, multiple spaces",
        input: "<resolution   height='1080'   width='1920'  ></resolution>",
        expect: [
            ExpectElementStart("resolution", {"height": "1080", "width": "1920"}),
            ExpectElementEnd("resolution")
        ]
    });

    runTest({
        name: "Single element, multiple attributes with duplicates",
        input: "<resolution height='1080' width='1280' width='1920'></resolution>",
        expect: [
            ExpectElementStart("resolution", {"height": "1080", "width": "1920"}),
            ExpectElementEnd("resolution")
        ]
    });

    runTest({
        name: "Single element, multiple attributes, newline delimiter",
        input: "<resolution height='1080'\nwidth='1920'></resolution>",
        expect: [
            ExpectElementStart("resolution", {"height": "1080", "width": "1920"}),
            ExpectElementEnd("resolution")
        ]
    });

    runTest({
        name: "Single element, Multiple attributes, No Spaces",
        input: "<resolution height='1080'width='1920'></resolution>",
        expect: [
            ExpectElementStart("resolution", {"height": "1080", "width": "1920"}),
            ExpectElementEnd("resolution")
        ]
    });

    runTest({
        name: "Single element, multiple attributes, no space, self closing",
        input: "<resolution height='1080'width='1920'/>",
        expect: [
            ExpectElementStart("resolution", {"height": "1080", "width": "1920"}),
            ExpectElementEnd("resolution")
        ]
    });

});
