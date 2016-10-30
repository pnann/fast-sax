# fast-sax [![Build Status](https://travis-ci.org/pnann/fast-sax.svg)](https://travis-ci.org/pnann/fast-sax) ![npm dependencies](https://david-dm.org/pnann/fast-sax.svg) [![Coverage Status](https://coveralls.io/repos/github/pnann/fast-sax/badge.svg?branch=master)](https://coveralls.io/github/pnann/fast-sax?branch=master)
> A minimal, dependency free, ES3 compatible, well tested, and lightning fast SAX-like XML parser for Node and the browser. 
Under 1KB gzipped and ready for your well-formed XML needs.

## Features
* A SAX-like API.
* Support for parsing regular `elements`, `text nodes`, `CDATA`, and `comments`.
* Absolutely no support for anything else. No processing instructions, no auto-unescaping.
* ECMAScript 3 support (IE6+).
* Fully unit tested.
* <1KB gzipped.

## Installation
#### Node

```console
$ npm install fast-sax
```

#### Browser

```html
<script src="fast-sax.min.js"></script>
```

## Usage

`fast-sax` exposes a SAX-like API. Given a string XML document, `fast-sax` will fire events associated
with the elements within. Consumers attach callbacks for the events they require and then may handle the parsed string
data at will. It operates synchronously, with attributes and text nodes being lazily parsed -- the consumer may choose
to extract them as part of the event handler.

### General Parsing
```javascript
var FastSax = require("fast-sax"); //In the browser: window.FastSax
var parser = new FastSax();

/*
 * This function will be called every time a new element is found. 
 * 
 * The first argument is the elementName, which is the raw string name of the element.
 * The second argument is a function for obtaining a map of attributes in the element. This function enables fast-sax to
 * avoid parsing the attributes until needed. It will be a map of attribute names to string values.
 */
parser.onElementStart = function(elementName, getAttributes) {
    const attributes = getAttributes();

    console.log(`Element: '${elementName}' name is ${attributes["to"]}`) //Element: 'message' to 'world'
};

/*
 * This function will be called every time an element has ended. This includes both self-closing elements and actual
 * close tags.
 */
parser.onElementEnd = function(elementName) {
    console.log(`Element end: '${elementName}'`); //Element end: 'message'
};

/*
* This function will be called every time a text node has been found. It is the user's responsibility to keep track
* of the parent element as needed.
* 
* The only argument, getText, is a function which returns the raw text as a string.
*/
parser.onText = function(getText) {
    const text = getText();
    
    console.log(`Text: '${text}'`); //Text: 'hello'
};

parser.parse("<message to='world'>hello</message>");
console.log("Parse complete.");

/*
 * Prints:
 * > Element: 'message' to 'world'
 * > Text: 'hello'
 * > Element end: 'message' 
 * > Parse complete.
 */
```

### Comments
`fast-sax` also supports parsing of comment blocks through the `onComment` callback.

```javascript
var FastSax = require("fast-sax"); //In the browser: window.FastSax
var parser = new FastSax();

/*
 * This function will be called every time a comment block has been found.
 * 
 * The only argument, getText, is a function which returns the raw text as a string.
 */
parser.onComment = function(getText) {
    const text = getText();
    
    console.log(`Found comment: ' ${text} '`); //Comment: ' hello '
};

parser.parse("<!-- hello -->");
console.log("Parse complete.");

/*
 * Prints:
 * > Comment: ' hello '
 * > Parse complete.
 */
```

### CDATA
`fast-sax` also supports parsing of CDATA blocks through the `onCData` callback.

```javascript
var FastSax = require("fast-sax"); //In the browser: window.FastSax
var parser = new FastSax();

/*
 * This function will be called every time a CDATA block has been found.
 * 
 * The only argument, getText, is a function which returns the raw text as a string.
 */
parser.onCData = function(getText) {
    const text = getText();
    
    console.log(`Found CDATA: ' ${text} '`); //Found comment: ' hello cdata '
};

parser.parse("<![CDATA[ hello cdata ]]>");
console.log("Parse complete.");

/*
 * Prints:
 * > Comment: ' hello cdata '
 * > Parse complete.
 */

```
## API

```javascript
class FastSax {

       /**
        * Fired when a text node is parsed.
        *
        * @param {() => string} getText A function returning the node text as a string.
        */
       onText: (getText: () => string) => void;
       
       /**
        * Fired when a a new element has been found.
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
}

```

## Versioning

`fast-sax` uses [SemVer](http://semver.org/) for versioning. All releases will be available on both Github and npm.

## [License](LICENSE)
MIT
