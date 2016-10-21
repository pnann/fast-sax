import runTest = require("../TestRunner");
import ExpectElementStart = require("../ExpectedCallbacks/ExpectElementStart");
import ExpectElementEnd = require("../ExpectedCallbacks/ExpectElementEnd");
import ExpectCData = require("../ExpectedCallbacks/ExpectCData");

runTest({
    name: "Single element with nested CDATA",
    input: "<dimension><![CDATA[ random random </dimension> ]]></dimension>",
    expect: [
        ExpectElementStart("dimension"),
        ExpectCData(" random random </dimension> "),
        ExpectElementEnd("dimension")
    ]
});

runTest({
    name: "Single CDATA element",
    input: "<![CDATA[ random random <dimension></dimension> <!-- not a comment, but CDATA! --> ]]>",
    expect: [
        ExpectCData(" random random <dimension></dimension> <!-- not a comment, but CDATA! --> "),
    ]
});

runTest({
    name: "Malformed, no content or end",
    input: "<![CDATA[",
    expect: []
});

runTest({
    name: "Malformed, no end",
    input: "<![CDATA[ <>/> <!-- blah",
    expect: []
});
