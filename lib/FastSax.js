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
                if (xmlContents.charCodeAt(startIndex) === FastSax.OPEN_BRACKET) {
                    if (startIndex - lastElementEnd > 0) {
                        this.onText(function () { return xmlContents.substring(lastElementEnd, startIndex); });
                    }
                    var nextChar = xmlContents.charCodeAt(startIndex + 1);
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
                    this.onElementStart(elementName, function () { return FastSax.extractAttributes(xmlContents, startIndex, endIndex); });
                    if (xmlContents.charCodeAt(endIndex - 1) === FastSax.FORWARD_SLASH) {
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
            var char = sourceText.charCodeAt(currentIndex);
            if (activeAttribute === null) {
                if (char === FastSax.EQUALS) {
                    activeAttribute = sourceText.substring(start, currentIndex);
                    currentIndex += 1;
                    start = currentIndex;
                }
                else if (char === FastSax.SPACE || char === FastSax.NEW_LINE) {
                    currentIndex += 1;
                    start = currentIndex;
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
    ;
    FastSax.OPEN_BRACKET = 60;
    FastSax.FORWARD_SLASH = 47;
    FastSax.EXCLAMATION_POINT = 33;
    FastSax.EQUALS = 61;
    FastSax.NEW_LINE = 10;
    FastSax.SPACE = 32;
    FastSax.SINGLE_QUOTE = 39;
    FastSax.DOUBLE_QUOTE = 34;
    FastSax.CDATA_PREFIX = "[CDATA[";
    FastSax.CDATA_SUFFIX = "]]>";
    FastSax.ELEMENT_SUFFIX = ">";
    FastSax.COMMENT_PREFIX = "--";
    FastSax.COMMENT_SUFFIX = "-->";
    return FastSax;
}());
module.exports = FastSax;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRmFzdFNheC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9GYXN0U2F4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRztBQUNILElBQUssSUFLSjtBQUxELFdBQUssSUFBSTtJQUNMLHFDQUFPLENBQUE7SUFDUCxpREFBYSxDQUFBO0lBQ2IscUNBQU8sQ0FBQTtJQUNQLGlDQUFLLENBQUE7QUFDVCxDQUFDLEVBTEksSUFBSSxLQUFKLElBQUksUUFLUjtBQUVELElBQUksSUFBSSxHQUFRO0FBQ2hCLENBQUMsQ0FBQztBQUVGOztHQUVHO0FBQ0g7SUFBQTtRQWtCSTs7Ozs7OztXQU9HO1FBQ0ksV0FBTSxHQUFvQyxJQUFJLENBQUM7UUFFdEQ7Ozs7O1dBS0c7UUFDSSxtQkFBYyxHQUF3RixJQUFJLENBQUM7UUFFbEg7Ozs7V0FJRztRQUNJLGlCQUFZLEdBQWtDLElBQUksQ0FBQztRQUUxRDs7OztXQUlHO1FBQ0ksWUFBTyxHQUFvQyxJQUFJLENBQUM7UUFFdkQ7Ozs7V0FJRztRQUNJLGNBQVMsR0FBb0MsSUFBSSxDQUFDO0lBcUo3RCxDQUFDO0lBbkpHOzs7O09BSUc7SUFDSSx1QkFBSyxHQUFaLFVBQWEsV0FBbUI7UUFDNUIsSUFBSSxVQUFVLEdBQVMsSUFBSSxDQUFDO1FBQzVCLElBQUksY0FBYyxHQUFHLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNoRSxJQUFJLGNBQWMsR0FBRyxjQUFjLENBQUM7UUFFcEMsS0FBSyxJQUFJLFVBQVUsR0FBRyxjQUFjLEVBQUUsVUFBVSxHQUFHLFdBQVcsQ0FBQyxNQUFNLEVBQUUsVUFBVSxFQUFFLEVBQUU7WUFDakYsSUFBSSxVQUFVLEtBQUssSUFBSSxFQUFFO2dCQUNyQixJQUFJLFdBQVcsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLEtBQUssT0FBTyxDQUFDLFlB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