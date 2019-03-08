MathMD
======

> Markdown + LaTeX = HTML

[![JavaScript Style Guide](https://cdn.rawgit.com/standard/standard/master/badge.svg)](https://github.com/standard/standard)

**Attention:** If you're looking for a **fast web library**, you'll probably love [KaTeX](https://katex.org/docs/node.html)! This one is just a CLI to make HTML files from Markdown and LaTeX!

## What is it?
MathMD is a simple npm package with a CLI that compiles a file written in **Markdown** with **LaTeX** expression into a **single HTML** file.

It's useful if you need to read math stuff on a ebook read or tablet, without messing with PDFs written too small.

## Installation

- Install [Node](https://nodejs.org/)
- Install **MathMD** by pasting `npm install -g mathmd` in your terminal
- Done 😃!

## Usage

### CLI

- Run `mathmd` to start the interactive setup.

- Run `mathmd --help` for details about the parameters.

| Flags | Description |
|-------------------|-----------|
| `-a`, `--author <string>` | specify an author (wrap it in quotes!) |
| `-s`, `--stylesheet <path/to/file>` | load a custom CSS for the file |
| `-M`, `--mml` | export with formulae in MathML |
| `-S`, `--svg`, | export with formulae as SVG |
| `-w`, `--watch`, | automatically compile when you save the file |
| `-i`, `--interactive` | Run in interactive mode |

By loading an external CSS stylesheet, you can customize the look of the resulting HTML file!

### Programmatically

If you prefer to use it in your own program, you can use
```js
// Import the package
const mathMD = require('mathmd')

/* ... */

// Call it
mathmd(files, options, callback)
```
- `files` is an **array** of *paths*
- `options` is the following **object**
```js
let options = {
    stylesheet: 'path/to/stylesheet.css',
    author: 'John Doe',
    mathjax: { /* MathJax npm options */ },
    watch: false // Set to true to watch for changes
}
```
See ["node options" on this page](https://github.com/pkra/mathjax-node-page#usage) for more informations about `mathjax` object, or see it here below:
```js
{
  ex: 6, // ex-size in pixels
  width: 100, // width of math container (in ex) for linebreaking and tags
  useFontCache: true, // use <defs> and <use> in svg output?
  useGlobalCache: false, // use common <defs> for all equations?
  state: mjstate, // track global state
  linebreaks: false, // do linebreaking?
  equationNumbers: "none", // or "AMS" or "all"
  math: "", // the math to typeset
  html: false, // generate HTML output?
  css: false, // generate CSS for HTML output?
  mml: false, // generate mml output?
  svg: false, // generate svg output?
  speakText: true, // add spoken annotations to output?
  timeout: 10 * 1000, // 10 second timeout before restarting MathJax
}
```
- `callback` is a **function** which takes *nothing* as parameter.

## Syntax 

I recommend installing an extension like [mdmath](https://marketplace.visualstudio.com/items?itemName=goessner.mdmath) for Visual Studio Code as syntax highlighter, since it's the same one MathMD uses.

For the Markdown part, it's standard Markdown, and I used [Marked](https://www.npmjs.com/package/marked) as parser.

For the LaTeX part, it's standard expressions and symbol, with support of AMS Math, thanks to [MathJax](https://www.mathjax.org/).

## Functionalities
- Watcher and live reload ✔︎
- Integrated CSS with high readability ✔︎
- Ebook friendly ✔︎
- SVG or MathML for your expressions ✔︎
- Expression reference (to be added) ✘
- Figure captioning (to be added) ✘