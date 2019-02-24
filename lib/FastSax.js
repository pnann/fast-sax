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
/**
 * A regular expression that matches element names. This is a simplified version of the `Name` (https://www.w3.org/TR/xml/#NT-Name) rule
 * from the XML specification.
 */
var NAME_START_CHAR = "[:A-Z_a-z]";
var NAME_CHAR = "[:A-Z_a-z.0-9-]";
var NAME = "" + NAME_START_CHAR + NAME_CHAR + "*";
/**
 * A regular expression that matches whitespaces. This is equivalent to the `S` (https://www.w3.org/TR/xml/#NT-S) rule
 * from the XML specification.
 */
var S = "[ \\r\\n\\t]*";
/**
 * A regular expression that matches attribute name and value pairs. This is a simplified version of the `Attribute`
 * (https://www.w3.org/TR/xml/#NT-Attribute) rule from the XML specification, that also chomps white spaces.
 */
var ATTRIBUTE = S + "(" + NAME + ")" + S + "=" + S + "[\"']([^\"']*)[\"']" + S;
var noOp = function () {
};
/**
 * A minimal, dependency free, ES3 compatible, well tested, and lightning fast SAX-like XML parser for Node and the browser.
 */
var FastSax = /** @class */ (function () {
    function FastSax() {
        this.nameRegExp = new RegExp("(" + NAME + ")", "gm");
        this.attributeRegExp = new RegExp(ATTRIBUTE, "gm");
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
        var _this = this;
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
                this.nameRegExp.lastIndex = startIndex;
                var match = this.nameRegExp.exec(xmlContents);
                if (match !== null) {
                    elementName = match[1];
                    startIndex = this.nameRegExp.lastIndex;
                }
                if (elementName === null) {
                    elementName = xmlContents.substring(startIndex, endIndex);
                }
                if (elementName) {
                    this.onElementStart(elementName, function () { return _this.extractAttributes(xmlContents, startIndex, endIndex); });
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
    FastSax.prototype.extractAttributes = function (sourceText, start, end) {
        var contents = sourceText.substring(start, end);
        start = 0;
        end = contents.length;
        var attributeMap = {};
        this.attributeRegExp.lastIndex = start;
        while (this.attributeRegExp.lastIndex < end) {
            var match = this.attributeRegExp.exec(contents);
            if (match === null) {
                break;
            }
            var name = match[1];
            var value = match[2];
            attributeMap[name] = value;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRmFzdFNheC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9GYXN0U2F4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRztBQUNILElBQUssSUFLSjtBQUxELFdBQUssSUFBSTtJQUNMLHFDQUFPLENBQUE7SUFDUCxpREFBYSxDQUFBO0lBQ2IscUNBQU8sQ0FBQTtJQUNQLGlDQUFLLENBQUE7QUFDVCxDQUFDLEVBTEksSUFBSSxLQUFKLElBQUksUUFLUjtBQUVEOzs7R0FHRztBQUNILElBQU0sZUFBZSxHQUFHLFlBQVksQ0FBQztBQUNyQyxJQUFNLFNBQVMsR0FBRyxpQkFBaUIsQ0FBQztBQUNwQyxJQUFNLElBQUksR0FBRyxLQUFHLGVBQWUsR0FBRyxTQUFTLE1BQUcsQ0FBQztBQUUvQzs7O0dBR0c7QUFDSCxJQUFNLENBQUMsR0FBRyxlQUFlLENBQUM7QUFFMUI7OztHQUdHO0FBQ0gsSUFBTSxTQUFTLEdBQU0sQ0FBQyxTQUFJLElBQUksU0FBSSxDQUFDLFNBQUksQ0FBQywyQkFBc0IsQ0FBRyxDQUFDO0FBRWxFLElBQUksSUFBSSxHQUFRO0FBQ2hCLENBQUMsQ0FBQztBQUVGOztHQUVHO0FBQ0g7SUFBQTtRQW9CWSxlQUFVLEdBQUcsSUFBSSxNQUFNLENBQUMsTUFBSSxJQUFJLE1BQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUMzQyxvQkFBZSxHQUFHLElBQUksTUFBTSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUV0RDs7Ozs7OztXQU9HO1FBQ0ksV0FBTSxHQUFvQyxJQUFJLENBQUM7UUFFdEQ7Ozs7O1dBS0c7UUFDSSxtQkFBYyxHQUF3RixJQUFJLENBQUM7UUFFbEg7Ozs7V0FJRztRQUNJLGlCQUFZLEdBQWtDLElBQUksQ0FBQztRQUUxRDs7OztXQUlHO1FBQ0ksWUFBTyxHQUFvQyxJQUFJLENBQUM7UUFFdkQ7Ozs7V0FJRztRQUNJLGNBQVMsR0FBb0MsSUFBSSxDQUFDO0lBd0k3RCxDQUFDO0lB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