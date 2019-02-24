/**
 * A minimal, dependency free, ES3 compatible, well tested, and lightning fast SAX-like XML parser for Node and the browser.
 */
declare class FastSax {
    private static OPEN_BRACKET;
    private static FORWARD_SLASH;
    private static EXCLAMATION_POINT;
    private static EQUALS;
    private static SPACE;
    private static TAB;
    private static NEW_LINE;
    private static CARRIAGE_RETURN;
    private static SINGLE_QUOTE;
    private static DOUBLE_QUOTE;
    private static CDATA_PREFIX;
    private static CDATA_SUFFIX;
    private static ELEMENT_SUFFIX;
    private static COMMENT_PREFIX;
    private static COMMENT_SUFFIX;
    private nameRegExp;
    private attributeRegExp;
    /**
     * Fired when a text node is parsed.
     *
     * FastSax does NOT trim or otherwise change text values. Indentation and other whitespace will result in onText
     * being called.
     *
     * @param {() => string} getText A function returning the node text as a string.
     */
    onText: (getText: () => string) => void;
    /**
     * Fired when a new element has been found.
     *
     * @param {string} elementName The name of the element.
     * @param {() => {[attribute: string]: string}} getAttributes A function returning a map of attribute names to values.
     */
    onElementStart: (elementName: string, getAttributes: () => {
        [attribute: string]: string;
    }) => void;
    /**
     * Fired when an element's end has been found.
     *
     * @param {string} elementName the name of the element.
     */
    onElementEnd: (elementName: string) => void;
    /**
     * Fired when a CDATA block has been found.
     *
     * @param {() => string} getText A function returning the CDATA text as a string.
     */
    onCData: (getText: () => string) => void;
    /**
     * Fired when a comment block has been found.
     *
     * @param {() => string} getText A function returning the comment text as a string.
     */
    onComment: (getText: () => string) => void;
    /**
     * Parse the given XML document (in string form), emitting events along the way.
     *
     * @param {string} xmlContents Valid, well formed XML.
     */
    parse(xmlContents: string): void;
    /**
     * Extracts a map of attributes from a given text range.
     *
     * @param {string} sourceText A string containing both the start and end positions.
     * @param {number} start The first index of the attribute block, inclusive.
     * @param {string} end The last index of the attribute block, exclusive.
     * @returns {{[attribute: string]: string}} A map of string attribute names to their associated values.
     */
    private extractAttributes;
    /**
     * Returns whether or not the text starts with a string at a certain position.
     *
     * @param {string} text The text to compare against.
     * @param {number} start The index to expect a match.
     * @param {string} match The string to expect.
     *
     * @returns {boolean}
     */
    private static startsWith;
}
export = FastSax;
