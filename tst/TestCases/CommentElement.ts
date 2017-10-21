import runTest = require("../TestRunner");
import ExpectElementStart = require("../ExpectedCallbacks/ExpectElementStart");
import ExpectElementEnd = require("../ExpectedCallbacks/ExpectElementEnd");
import ExpectComment = require("../ExpectedCallbacks/ExpectComment");

describe("Comments", () => {

    runTest({
        name: "Single Element with nested comment",
        input: "<dimension><!-- random random --></dimension>",
        expect: [
            ExpectElementStart("dimension"),
            ExpectComment(" random random "),
            ExpectElementEnd("dimension")
        ]
    });

});
