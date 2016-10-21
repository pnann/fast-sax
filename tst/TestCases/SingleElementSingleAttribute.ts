import runTest = require("../TestRunner");
import ExpectElementStart = require("../ExpectedCallbacks/ExpectElementStart");
import ExpectElementEnd = require("../ExpectedCallbacks/ExpectElementEnd");

runTest({
    name: "Single Element, Single Attribute",
    input: "<dimension height='11111'></dimension>",
    expect: [
        ExpectElementStart("dimension", {"height": "11111"}),
        ExpectElementEnd("dimension")
    ]
});

runTest({
    name: "Single Element, Single Attribute, Self Closing",
    input: "<dimension height='11111'/>",
    expect: [
        ExpectElementStart("dimension", {"height": "11111"}),
        ExpectElementEnd("dimension")
    ]
});
