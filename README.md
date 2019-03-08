MathMD
======

> Markdown + LaTeX = HTML

[![JavaScript Style Guide](https://cdn.rawgit.com/standard/standard/master/badge.svg)](https://github.com/standard/standard)

**Attention:** If you're looking for a **fast web library**, you'll probably love [KaTeX](https://katex.org/docs/node.html)! This one is just a CLI!

## What is it?
MathMD is a simple npm package with a CLI that compiles a file written in **Markdown** with *LaTeX* expression into a single HTML file.

It's useful if you need to read math stuff on a ebook read or tablet, without messing with PDFs written too small.

## Installation

- Install [Node](https://nodejs.org/)
- Install **MathMD** by pasting `npm install -g mathmd` in your terminal
- Done!

## Usage

Run `mathmd` to start the interactive setup!

Run `mathmd --help` for details about the parameters.

| Flags | Description |
|-------------------|-----------|
| `-a`, `--author <string>` | specify an author (wrap it in quotes!) |
| `-s`, `--stylesheet <path/to/file>` | load a custom CSS for the file |
| `-M`, `--mml` | export with formulae in MathML |
| `-S`, `--svg`, | export with formulae as SVG |
| `-w`, `--watch`, | automatically compile when you save the file |
| `-i`, `--interactive` | Run in interactive mode |

By loading an external CSS stylesheet, you can customize the look of the resulting HTML file!

## Syntax 

I recommend installing an extension like [mdmath](https://marketplace.visualstudio.com/items?itemName=goessner.mdmath) for Visual Studio Code as syntax highlighter, since it's the same one MathMD uses.

For the Markdown part, it's standard Markdown, and I used [Marked](https://www.npmjs.com/package/marked) as parser.

For the LaTeX part, it's standard expressions and symbol, with support of AMS Math, thanks to [MathJax](https://www.mathjax.org/).
