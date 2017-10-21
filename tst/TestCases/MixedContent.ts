import runTest = require("../TestRunner");
import ExpectElementStart = require("../ExpectedCallbacks/ExpectElementStart");
import ExpectElementEnd = require("../ExpectedCallbacks/ExpectElementEnd");
import ExpectText = require("../ExpectedCallbacks/ExpectText");

runTest({
    name: "Multiple elements with mixed content.",
    input: "<dimension>starting blah<random>super blah</random>ending blah</dimension>",
    expect: [
        ExpectElementStart("dimension"),
        ExpectText("starting blah"),
        ExpectElementStart("random"),
        ExpectText("super blah"),
        ExpectElementEnd("random"),
        ExpectText("ending blah"),
        ExpectElementEnd("dimension")
    ]
});

for(const whitespace of [" ", "\t", "\n"]) {
    runTest({
        name: `Multiple elements with mixed content and superfluous '${JSON.stringify(whitespace)}'`,
        input: `<dimension>${whitespace}<random>super blah</random>ending blah</dimension>`,
        expect: [
            ExpectElementStart("dimension"),
            ExpectText(whitespace),
            ExpectElementStart("random"),
            ExpectText("super blah"),
            ExpectElementEnd("random"),
            ExpectText("ending blah"),
            ExpectElementEnd("dimension")
        ]
    });
}
