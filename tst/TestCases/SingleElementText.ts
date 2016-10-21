import runTest = require("../TestRunner");
import ExpectElementStart = require("../ExpectedCallbacks/ExpectElementStart");
import ExpectElementEnd = require("../ExpectedCallbacks/ExpectElementEnd");
import ExpectText = require("../ExpectedCallbacks/ExpectText");

for (let input of ["Random Text", " ", "\n", "\t"]) {
    runTest({
        name: `Single Element with text '${input}'`,
        input: `<dimension>${input}</dimension>`,
        expect: [
            ExpectElementStart("dimension"),
            ExpectText(input),
            ExpectElementEnd("dimension")
        ]
    });
}
