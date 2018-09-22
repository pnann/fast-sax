import runTest = require("../TestRunner");
import ExpectElementStart = require("../ExpectedCallbacks/ExpectElementStart");
import ExpectElementEnd = require("../ExpectedCallbacks/ExpectElementEnd");

describe("Attributes with extra whitespace", () => {

    runTest({
        name: "Single element, single attribute, extra odd whitespace",
        input: "<resolution   height='1080'   ></resolution>",
        expect: [
            ExpectElementStart("resolution", {"height": "1080"}),
            ExpectElementEnd("resolution")
        ]
    });

    runTest({
        name: "Single element, single attribute, extra even whitespace",
        input: "<resolution  height='1080'    ></resolution>",
        expect: [
            ExpectElementStart("resolution", {"height": "1080"}),
            ExpectElementEnd("resolution")
        ]
    });

    runTest({
        name: "Single element, single attribute, extra new lines",
        input: `<resolution
                    height='1080'
                ></resolution>`,
        expect: [
            ExpectElementStart("resolution", {"height": "1080"}),
            ExpectElementEnd("resolution")
        ]
    });

    runTest({
        name: "Single element, single attribute, extra tabs",
        input: `<resolution		height='1080'	></resolution>`,
        expect: [
            ExpectElementStart("resolution", {"height": "1080"}),
            ExpectElementEnd("resolution")
        ]
    });

    runTest({
        name: "Single element, multiple attributes, extra odd whitespace",
        input: "<resolution height='1080'   width='1920'      ></resolution>",
        expect: [
            ExpectElementStart("resolution", {"height": "1080", "width": "1920"}),
            ExpectElementEnd("resolution")
        ]
    });

    runTest({
        name: "Single element, multiple attributes, extra even whitespace",
        input: "<resolution  height='1080'    width='1920'      ></resolution>",
        expect: [
            ExpectElementStart("resolution", {"height": "1080", "width": "1920"}),
            ExpectElementEnd("resolution")
        ]
    });

    runTest({
        name: "Single element, multiple attributes, extra newlines",
        input: `<resolution
height='1080'
width='1920'
></resolution>`,
        expect: [
            ExpectElementStart("resolution", {"height": "1080", "width": "1920"}),
            ExpectElementEnd("resolution")
        ]
    });
});
