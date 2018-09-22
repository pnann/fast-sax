"use strict";
/**
 * The type of element currently being evaluated.
 */
var Type;
(function (Type) {
    Type[Type["ELEMENT"] = 0] = "ELEMENT";
    Type[Type["CLOSE_ELEMENT"] = 1] = "CLOSE_ELEMENT";
    Type[Type["COMMENT"] = 2] = "COMMENT";
    Type[Type["CDATA"] = 3] = "CDATA";
})(Type || (Type = {}));
var noOp = function () {
};
/**
 * A minimal, dependency free, ES3 compatible, well tested, and lightning fast SAX-like XML parser for Node and the browser.
 */
var FastSax = /** @class */ (function () {
    function FastSax() {
        /**
         * Fired when a text node is parsed.
         *
         * FastSax does NOT trim or otherwise change text values. Indentation and other whitespace will result in onText
         * being called.
         *
         * @param {() => string} getText A function returning the node text as a string.
         */
        this.onText = noOp;
        /**
         * Fired when a new element has been found.
         *
         * @param {string} elementName The name of the element.
         * @param {() => {[attribute: string]: string}} getAttributes A function returning a map of attribute names to values.
         */
        this.onElementStart = noOp;
        /**
         * Fired when an element's end has been found.
         *
         * @param {string} elementName the name of the element.
         */
        this.onElementEnd = noOp;
        /**
         * Fired when a CDATA block has been found.
         *
         * @param {() => string} getText A function returning the CDATA text as a string.
         */
        this.onCData = noOp;
        /**
         * Fired when a comment block has been found.
         *
         * @param {() => string} getText A function returning the comment text as a string.
         */
        this.onComment = noOp;
    }
    /**
     * Parse the given XML document (in string form), emitting events along the way.
     *
     * @param {string} xmlContents Valid, well formed XML.
     */
    FastSax.prototype.parse = function (xmlContents) {
        var activeType = null;
        var textStartIndex = xmlContents.charAt(0) === "\uFEFF" ? 1 : 0;
        var lastElementEnd = textStartIndex;
        for (var startIndex = textStartIndex; startIndex < xmlContents.length; startIndex++) {
            if (activeType === null) {
                if (xmlContents[startIndex] === FastSax.OPEN_BRACKET) {
                    if (startIndex - lastElementEnd > 0) {
                        this.onText(function () { return xmlContents.substring(lastElementEnd, startIndex); });
                    }
                    var nextChar = xmlContents[startIndex + 1];
                    if (nextChar === FastSax.FORWARD_SLASH) {
                        activeType = Type.CLOSE_ELEMENT;
                        startIndex += 1;
                    }
                    else if (nextChar === FastSax.EXCLAMATION_POINT) {
                        if (FastSax.startsWith(xmlContents, startIndex + 2, FastSax.CDATA_PREFIX)) {
                            activeType = Type.CDATA;
                            startIndex += 8;
                        }
                        else if (FastSax.startsWith(xmlContents, startIndex + 2, FastSax.COMMENT_PREFIX)) {
                            activeType = Type.COMMENT;
                            startIndex += 3;
                        }
                    }
                    else {
                        activeType = Type.ELEMENT;
                    }
                }
                continue;
            }
            if (activeType === Type.ELEMENT) {
                var endIndex = xmlContents.indexOf(FastSax.ELEMENT_SUFFIX, startIndex);
                if (endIndex === -1)
                    break;
                var elementName = null;
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
                    this.onElementStart(elementName, function () { return FastSax.extractAttributes(xmlContents, startIndex, endIndex); });
                    if (xmlContents[endIndex - 1] === FastSax.FORWARD_SLASH) {
                        this.onElementEnd(elementName);
                    }
                }
                startIndex = endIndex;
            }
            else if (activeType === Type.CLOSE_ELEMENT) {
                var endIndex = xmlContents.indexOf(FastSax.ELEMENT_SUFFIX, startIndex);
                if (endIndex === -1)
                    break;
                this.onElementEnd(xmlContents.substring(startIndex, endIndex));
                startIndex = endIndex;
            }
            else if (activeType === Type.CDATA) {
                var endIndex = xmlContents.indexOf(FastSax.CDATA_SUFFIX, startIndex);
                if (endIndex === -1)
                    break;
                this.onCData(function () { return xmlContents.substring(startIndex, endIndex); });
                startIndex = endIndex + 2;
            }
            else if (activeType === Type.COMMENT) {
                var endIndex = xmlContents.indexOf(FastSax.COMMENT_SUFFIX, startIndex);
                if (endIndex === -1)
                    break;
                this.onComment(function () { return xmlContents.substring(startIndex, endIndex); });
                startIndex = endIndex + 2;
            }
            lastElementEnd = startIndex + 1;
            activeType = null;
        }
    };
    ;
    /**
     * Extracts a map of attributes from a given text range.
     *
     * @param {string} sourceText A string containing both the start and end positions.
     * @param {number} start The first index of the attribute block, inclusive.
     * @param {string} end The last index of the attribute block, exclusive.
     * @returns {{[attribute: string]: string}} A map of string attribute names to their associated values.
     */
    FastSax.extractAttributes = function (sourceText, start, end) {
        var attributeMap = {};
        var activeAttribute = null;
        for (var currentIndex = start; currentIndex < end; currentIndex++) {
            var char = sourceText[currentIndex];
            if (activeAttribute === null) {
                if (char === FastSax.EQUALS) {
                    activeAttribute = sourceText.substring(start, currentIndex);
                    currentIndex += 1;
                    start = currentIndex;
                }
                else if (char === FastSax.FORWARD_SLASH
                    || char === FastSax.SPACE
                    || char === FastSax.TAB
                    || char === FastSax.NEW_LINE
                    || char === FastSax.CARRIAGE_RETURN) {
                    start = currentIndex + 1;
                }
            }
            else {
                if (char === FastSax.DOUBLE_QUOTE || char === FastSax.SINGLE_QUOTE) {
                    attributeMap[activeAttribute] = sourceText.substring(start + 1, currentIndex);
                    start = currentIndex + 1;
                    activeAttribute = null;
                }
            }
        }
        return attributeMap;
    };
    /**
     * Returns whether or not the text starts with a string at a certain position.
     *
     * @param {string} text The text to compare against.
     * @param {number} start The index to expect a match.
     * @param {string} match The string to expect.
     *
     * @returns {boolean}
     */
    FastSax.startsWith = function (text, start, match) {
        if (text.startsWith) {
            return text.startsWith(match, start);
        }
        return text.substr(start, match.length) === match;
    };
    ;
    FastSax.OPEN_BRACKET = "<";
    FastSax.FORWARD_SLASH = "/";
    FastSax.EXCLAMATION_POINT = "!";
    FastSax.EQUALS = "=";
    FastSax.SPACE = " ";
    FastSax.TAB = "\t";
    FastSax.NEW_LINE = "\n";
    FastSax.CARRIAGE_RETURN = "\r";
    FastSax.SINGLE_QUOTE = "'";
    FastSax.DOUBLE_QUOTE = "\"";
    FastSax.CDATA_PREFIX = "[CDATA[";
    FastSax.CDATA_SUFFIX = "]]>";
    FastSax.ELEMENT_SUFFIX = ">";
    FastSax.COMMENT_PREFIX = "--";
    FastSax.COMMENT_SUFFIX = "-->";
    return FastSax;
}());
module.exports = FastSax;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRmFzdFNheC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9GYXN0U2F4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRztBQUNILElBQUssSUFLSjtBQUxELFdBQUssSUFBSTtJQUNMLHFDQUFPLENBQUE7SUFDUCxpREFBYSxDQUFBO0lBQ2IscUNBQU8sQ0FBQTtJQUNQLGlDQUFLLENBQUE7QUFDVCxDQUFDLEVBTEksSUFBSSxLQUFKLElBQUksUUFLUjtBQUVELElBQUksSUFBSSxHQUFRO0FBQ2hCLENBQUMsQ0FBQztBQUVGOztHQUVHO0FBQ0g7SUFBQTtRQW9CSTs7Ozs7OztXQU9HO1FBQ0ksV0FBTSxHQUFvQyxJQUFJLENBQUM7UUFFdEQ7Ozs7O1dBS0c7UUFDSSxtQkFBYyxHQUF3RixJQUFJLENBQUM7UUFFbEg7Ozs7V0FJRztRQUNJLGlCQUFZLEdBQWtDLElBQUksQ0FBQztRQUUxRDs7OztXQUlHO1FBQ0ksWUFBTyxHQUFvQyxJQUFJLENBQUM7UUFFdkQ7Ozs7V0FJRztRQUNJLGNBQVMsR0FBb0MsSUFBSSxDQUFDO0lBd0o3RCxDQUFDO0lBdEpHOzs7O09BSUc7SUFDSSx1QkFBSyxHQUFaLFVBQWEsV0FBbUI7UUFDNUIsSUFBSSxVQUFVLEdBQVMsSUFBSSxDQUFDO1FBQzVCLElBQUksY0FBYyxHQUFHLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNoRSxJQUFJLGNBQWMsR0FBRyxjQUFjLENBQUM7UUFFcEMsS0FBSyxJQUFJLFVBQVUsR0FBRyxjQUFjLEVBQUUsVUFBVSxHQUFHLFdBQVcsQ0FBQyxNQUFNLEVBQUUsVUFBVSxFQUFFLEVBQUU7WUFDakYsSUFBSSxVQUFVLEtBQUssSUFBSSxFQUFFO2dCQUNyQixJQUFJLFdBQVcsQ0FBQyxVQUFVLENBQUMsS0FBSyxPQUFPLENBQUMsWUFBWSxFQUFFO29C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