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
         * FastSax does NOT trim or otherwise change text values. If you're parsing content with whitespace (e.g. indentation),
         * those will result in onText being called.
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRmFzdFNheC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9GYXN0U2F4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRztBQUNILElBQUssSUFLSjtBQUxELFdBQUssSUFBSTtJQUNMLHFDQUFPLENBQUE7SUFDUCxpREFBYSxDQUFBO0lBQ2IscUNBQU8sQ0FBQTtJQUNQLGlDQUFLLENBQUE7QUFDVCxDQUFDLEVBTEksSUFBSSxLQUFKLElBQUksUUFLUjtBQUVELElBQUksSUFBSSxHQUFRO0FBQ2hCLENBQUMsQ0FBQztBQUVGOztHQUVHO0FBQ0g7SUFBQTtRQWtCSTs7Ozs7OztXQU9HO1FBQ0ksV0FBTSxHQUFvQyxJQUFJLENBQUM7UUFFdEQ7Ozs7O1dBS0c7UUFDSSxtQkFBYyxHQUF3RixJQUFJLENBQUM7UUFFbEg7Ozs7V0FJRztRQUNJLGlCQUFZLEdBQWtDLElBQUksQ0FBQztRQUUxRDs7OztXQUlHO1FBQ0ksWUFBTyxHQUFvQyxJQUFJLENBQUM7UUFFdkQ7Ozs7V0FJRztRQUNJLGNBQVMsR0FBb0MsSUFBSSxDQUFDO0lBcUo3RCxDQUFDO0lBbkpHOzs7O09BSUc7SUFDSSx1QkFBSyxHQUFaLFVBQWEsV0FBbUI7UUFDNUIsSUFBSSxVQUFVLEdBQVMsSUFBSSxDQUFDO1FBQzVCLElBQUksY0FBYyxHQUFHLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNoRSxJQUFJLGNBQWMsR0FBRyxjQUFjLENBQUM7UUFFcEMsR0FBRyxDQUFDLENBQUMsSUFBSSxVQUFVLEdBQUcsY0FBYyxFQUFFLFVBQVUsR0FBRyxXQUFXLENBQUMsTUFBTSxFQUFFLFVBQVUsRUFBRSxFQUFFLENBQUM7WUFDbEYsRUFBRSxDQUFDLENBQUMsVUFBVSxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ3RCLEVBQUUsQ0FBQyxDQUFDLFdB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