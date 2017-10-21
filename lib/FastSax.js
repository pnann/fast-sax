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
         * @param {() => string} getText A function returning the node text as a string.
         */
        this.onText = noOp;
        /**
         * Fired when a a new element has been found.
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
        var lastElementEnd = 0;
        for (var startIndex = 0; startIndex < xmlContents.length; startIndex++) {
            if (activeType === null) {
                if (xmlContents.charCodeAt(startIndex) === FastSax.OPEN_BRACKET) {
                    var nextChar = xmlContents.charCodeAt(startIndex + 1);
                    if (nextChar === FastSax.FORWARD_SLASH) {
                        if (startIndex - lastElementEnd > 0) {
                            this.onText(function () { return xmlContents.substring(lastElementEnd, startIndex); });
                        }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRmFzdFNheC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9GYXN0U2F4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRztBQUNILElBQUssSUFLSjtBQUxELFdBQUssSUFBSTtJQUNMLHFDQUFPLENBQUE7SUFDUCxpREFBYSxDQUFBO0lBQ2IscUNBQU8sQ0FBQTtJQUNQLGlDQUFLLENBQUE7QUFDVCxDQUFDLEVBTEksSUFBSSxLQUFKLElBQUksUUFLUjtBQUVELElBQUksSUFBSSxHQUFRO0FBQ2hCLENBQUMsQ0FBQztBQUVGOztHQUVHO0FBQ0g7SUFBQTtRQWtCSTs7OztXQUlHO1FBQ0ksV0FBTSxHQUFvQyxJQUFJLENBQUM7UUFFdEQ7Ozs7O1dBS0c7UUFDSSxtQkFBYyxHQUFzRixJQUFJLENBQUM7UUFFaEg7Ozs7V0FJRztRQUNJLGlCQUFZLEdBQWtDLElBQUksQ0FBQztRQUUxRDs7OztXQUlHO1FBQ0ksWUFBTyxHQUFvQyxJQUFJLENBQUM7UUFFdkQ7Ozs7V0FJRztRQUNJLGNBQVMsR0FBb0MsSUFBSSxDQUFDO0lBbUo3RCxDQUFDO0lBakpHOzs7O09BSUc7SUFDSSx1QkFBSyxHQUFaLFVBQWEsV0FBbUI7UUFDNUIsSUFBSSxVQUFVLEdBQVMsSUFBSSxDQUFDO1FBQzVCLElBQUksY0FBYyxHQUFHLENBQUMsQ0FBQztRQUV2QixHQUFHLENBQUMsQ0FBQyxJQUFJLFVBQVUsR0FBRyxDQUFDLEVBQUUsVUFBVSxHQUFHLFdBQVcsQ0FBQyxNQUFNLEVBQUUsVUFBVSxFQUFFLEVBQUUsQ0FBQztZQUNyRSxFQUFFLENBQUMsQ0FBQyxVQUFVLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDdEIsRUFBRSxDQUFDLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsS0FBSyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztvQkFDOUQsSUFBSSxRQUFRLEdBQUcsV0FBVyxDQUFDLFVBQVUsQ0FBQyxVQUFV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