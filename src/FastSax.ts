/**
 * The type of element currently being evaluated.
 */
enum Type {
    ELEMENT,
    CLOSE_ELEMENT,
    COMMENT,
    CDATA
}

var noOp: any = () => {
};

/**
 * A basic, minimal, fast XML FastSax with a SAX-like API.
 */
class FastSax {

    private static OPEN_BRACKET = 60;
    private static FORWARD_SLASH = 47;
    private static EXCLAMATION_POINT = 33;
    private static EQUALS = 61;
    private static NEW_LINE = 10;
    private static SPACE = 32;
    private static SINGLE_QUOTE = 39;
    private static DOUBLE_QUOTE = 34;

    private static CDATA_PREFIX = "[CDATA[";
    private static CDATA_SUFFIX = "]]>";

    private static ELEMENT_SUFFIX = ">";
    private static COMMENT_PREFIX = "--";
    private static COMMENT_SUFFIX = "-->";

    /**
     * Fired when a text node is parsed.
     *
     * @param {() => string} getText A function returning the node text as a string.
     */
    public onText: (getText: () => string) => void = noOp;

    /**
     * Fired when a a new element has been found.
     *
     * @param {string} elementName The name of the element.
     * @param {() => {[attribute: string]: string}} getAttributes A function returning a map of attribute names to values.
     */
    public onElementStart: (elementName: string, getAttributes: () => {[attribute: string]: string}) => void = noOp;

    /**
     * Fired when an element's end has been found.
     *
     * @param {string} elementName the name of the element.
     */
    public onElementEnd: (elementName: string) => void = noOp;

    /**
     * Fired when a CDATA block has been found.
     *
     * @param {() => string} getText A function returning the CDATA text as a string.
     */
    public onCData: (getText: () => string) => void = noOp;

    /**
     * Fired when a comment block has been found.
     *
     * @param {() => string} getText A function returning the comment text as a string.
     */
    public onComment: (getText: () => string) => void = noOp;

    /**
     * Parse the given XML document (in string form), emitting events along the way.
     *
     * @param {string} xmlContents Valid, well formed XML.
     */
    public parse(xmlContents: string) {
        var activeType: Type = null;
        var lastElementEnd = 0;

        for (var startIndex = 0; startIndex < xmlContents.length; startIndex++) {
            if (activeType === null) {
                if (xmlContents.charCodeAt(startIndex) === FastSax.OPEN_BRACKET) {
                    var nextChar = xmlContents.charCodeAt(startIndex + 1);
                    if (nextChar === FastSax.FORWARD_SLASH) {
                        if (startIndex - lastElementEnd > 0) {
                            this.onText(() => xmlContents.substring(lastElementEnd, startIndex));
                        }
                        activeType = Type.CLOSE_ELEMENT;
                        startIndex += 1;
                    } else if (nextChar === FastSax.EXCLAMATION_POINT) {
                        if (FastSax.startsWith(xmlContents, startIndex + 2, FastSax.CDATA_PREFIX)) {
                            activeType = Type.CDATA;
                            startIndex += 8;
                        } else if (FastSax.startsWith(xmlContents, startIndex + 2, FastSax.COMMENT_PREFIX)) {
                            activeType = Type.COMMENT;
                            startIndex += 3;
                        }
                    } else {
                        activeType = Type.ELEMENT;
                    }
                }

                continue;
            }

            if (activeType === Type.ELEMENT) {
                var endIndex = xmlContents.indexOf(FastSax.ELEMENT_SUFFIX, startIndex);
                if (endIndex === -1) break;

                var elementName: string = null;
                for (var i = startIndex; i < endIndex; i++) {
                    var char = xmlContents.charCodeAt(i);
                    if (char === FastSax.FORWARD_SLASH || char === FastSax.SPACE) {
                        elementName = xmlContents.substring(startIndex, i);
                        startIndex = i;
                        break;
                    }
                }

                if (elementName === null) {
                    elementName = xmlContents.substring(startIndex, endIndex);
                }

                if (elementName) {
                    this.onElementStart(elementName, () => FastSax.extractAttributes(xmlContents, startIndex, endIndex));

                    if (xmlContents.charCodeAt(endIndex - 1) === FastSax.FORWARD_SLASH) {
                        this.onElementEnd(elementName);
                    }
                }

                startIndex = endIndex;
            } else if (activeType === Type.CLOSE_ELEMENT) {
                var endIndex = xmlContents.indexOf(FastSax.ELEMENT_SUFFIX, startIndex);
                if (endIndex === -1) break;

                this.onElementEnd(xmlContents.substring(startIndex, endIndex));
                startIndex = endIndex;
            } else if (activeType === Type.CDATA) {
                var endIndex = xmlContents.indexOf(FastSax.CDATA_SUFFIX, startIndex);
                if (endIndex === -1) break;

                this.onCData(() => xmlContents.substring(startIndex, endIndex));
                startIndex = endIndex + 2;
            } else if (activeType === Type.COMMENT) {
                var endIndex = xmlContents.indexOf(FastSax.COMMENT_SUFFIX, startIndex);
                if (endIndex === -1) break;

                this.onComment(() => xmlContents.substring(startIndex, endIndex));
                startIndex = endIndex + 2;
            }

            lastElementEnd = startIndex + 1;
            activeType = null;
        }
    };

    /**
     * Extracts a map of attributes from a given text range.
     *
     * @param {string} sourceText A string containing both the start and end positions.
     * @param {number} start The first index of the attribute block, inclusive.
     * @param {string} end The last index of the attribute block, exclusive.
     * @returns {{[attribute: string]: string}} A map of string attribute names to their associated values.
     */
    private static extractAttributes(sourceText: string, start: number, end: number): {[attribute: string]: string} {
        var attributeMap: {[attribute: string]: string} = {};

        var activeAttribute: string = null;
        for (var currentIndex = start; currentIndex < end; currentIndex++) {
            var char = sourceText.charCodeAt(currentIndex);
            if (activeAttribute === null) {
                if (char === FastSax.EQUALS) {
                    activeAttribute = sourceText.substring(start, currentIndex);
                    currentIndex += 1;
                    start = currentIndex;
                } else if (char === FastSax.SPACE || char === FastSax.NEW_LINE) {
                    currentIndex += 1;
                    start = currentIndex;
                }
            } else {
                if (char === FastSax.DOUBLE_QUOTE || char === FastSax.SINGLE_QUOTE) {
                    attributeMap[activeAttribute] = sourceText.substring(start + 1, currentIndex);

                    start = currentIndex + 1;
                    activeAttribute = null;
                }
            }
        }

        return attributeMap;
    }

    /**
     * Returns whether or not the text starts with a string at a certain position.
     *
     * @param {string} text The text to compare against.
     * @param {number} start The index to expect a match.
     * @param {string} match The string to expect.
     *
     * @returns {boolean}
     */
    private static startsWith(text: string, start: number, match: string): boolean {
        if (text.length - start < match.length) {
            return false;
        }

        for (var i = 0; i < match.length; i++) {
            if (text.charCodeAt(start + i) !== match.charCodeAt(i)) {
                return false;
            }
        }

        return true;
    };
}

export = FastSax;
