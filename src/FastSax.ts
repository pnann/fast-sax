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
 * A minimal, dependency free, ES3 compatible, well tested, and lightning fast SAX-like XML parser for Node and the browser.
 */
class FastSax {

    private static OPEN_BRACKET = "<";
    private static FORWARD_SLASH = "/";
    private static EXCLAMATION_POINT = "!";
    private static EQUALS = "=";
    private static SPACE = " ";
    private static TAB = "\t";
    private static NEW_LINE = "\n";
    private static CARRIAGE_RETURN = "\r";
    private static SINGLE_QUOTE = "'";
    private static DOUBLE_QUOTE = "\"";

    private static CDATA_PREFIX = "[CDATA[";
    private static CDATA_SUFFIX = "]]>";

    private static ELEMENT_SUFFIX = ">";
    private static COMMENT_PREFIX = "--";
    private static COMMENT_SUFFIX = "-->";

    /**
     * Fired when a text node is parsed.
     *
     * FastSax does NOT trim or otherwise change text values. Indentation and other whitespace will result in onText
     * being called.
     *
     * @param {() => string} getText A function returning the node text as a string.
     */
    public onText: (getText: () => string) => void = noOp;

    /**
     * Fired when a new element has been found.
     *
     * @param {string} elementName The name of the element.
     * @param {() => {[attribute: string]: string}} getAttributes A function returning a map of attribute names to values.
     */
    public onElementStart: (elementName: string, getAttributes: () => { [attribute: string]: string }) => void = noOp;

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
        var textStartIndex = xmlContents.charAt(0) === "\uFEFF" ? 1 : 0;
        var lastElementEnd = textStartIndex;

        for (var startIndex = textStartIndex; startIndex < xmlContents.length; startIndex++) {
            if (activeType === null) {
                if (xmlContents[startIndex] === FastSax.OPEN_BRACKET) {
                    if (startIndex - lastElementEnd > 0) {
                        this.onText(() => xmlContents.substring(lastElementEnd, startIndex));
                    }

                    var nextChar = xmlContents[startIndex + 1];
                    if (nextChar === FastSax.FORWARD_SLASH) {
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
                    var char = xmlContents[i];
                    if (char === FastSax.FORWARD_SLASH
                        || char === FastSax.SPACE
                        || char === FastSax.TAB
                        || char === FastSax.NEW_LINE
                        || char === FastSax.CARRIAGE_RETURN) {

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

                    if (xmlContents[endIndex - 1] === FastSax.FORWARD_SLASH) {
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
    private static extractAttributes(sourceText: string, start: number, end: number): { [attribute: string]: string } {
        var attributeMap: { [attribute: string]: string } = {};

        var activeAttribute: string = null;
        for (var currentIndex = start; currentIndex < end; currentIndex++) {
            var char = sourceText[currentIndex];
            if (activeAttribute === null) {
                if (char === FastSax.EQUALS) {
                    activeAttribute = sourceText.substring(start, currentIndex);
                    currentIndex += 1;
                    start = currentIndex;
                } else if (char === FastSax.FORWARD_SLASH
                    || char === FastSax.SPACE
                    || char === FastSax.TAB
                    || char === FastSax.NEW_LINE
                    || char === FastSax.CARRIAGE_RETURN) {

                    start = currentIndex + 1;
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
        if ((<any> text).startsWith) {
            return (<any> text).startsWith(match, start);
        }

        return text.substr(start, match.length) === match;
    };
}

export = FastSax;
