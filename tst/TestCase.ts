import ExpectedCallback = require("./ExpectedCallback");

/**
 * A valid test case, specifically the expected callback behavior for a given input.
 */
interface TestCase {

    /**
     * The name of this test case.
     */
    name: string;

    /**
     * Raw input to be tested against.
     */
    input: string;

    /**
     * An ordered list of callbacks that are expected to be called. This must be the complete list of callbacks -- any
     * callbacks not in this list are treated as failures if called.
     */
    expect: ExpectedCallback[];
}

export = TestCase;
