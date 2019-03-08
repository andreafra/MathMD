/**
 * Pass parameters to set default values for questions
 * @returns Array of questions
 * @param {*} inputName The name the input file has
 */
const questions = [
  {
    type: 'input',
    name: 'input_files',
    message: 'Insert the path to the source file(s) (Space is a separator):\n'
  },
  {
    type: 'list',
    name: 'output_format',
    message: 'Choose the output format for your formulae:',
    choices: [
      'SVG',
      'MathML'],
    default: 2
  },
  {
    type: 'input',
    name: 'stylesheet_name',
    message: '[Optional] Insert a path to an external stylesheet:',
    default: 'none'
  },
  {
    type: 'input',
    name: 'author_name',
    message: '[Optional] Author:',
    default: 'none'
  },
  {
    type: 'confirm',
    name: 'watch',
    message: 'Do you want to watch for file changes and automatically reload the file preview in browser?',
    default: false
  }
]
function buildHtml (title, pages, style, author) {
  return `<html>
<head>
<meta charset="utf-8">
<meta name="author" content="${author}">
<title>${title}</title>
<style>${style}</style>
</head>
<body>
<div class="mmd-wrapper">
${pages.join('')}
</div>
</body>
</html>`
}

const formulaeOptions = {
  'page': {
    format: ['TeX'],
    singleDollars: true,
    fragment: true, // only HTML body
    fontURL: 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS' // for webfont urls in the CSS for HTML output
  },
  'node': {
    html: false,
    css: false,
    mml: true,
    svg: false
  }
}

const minify = {
  minifyCSS: true,
  removeComments: true,
  collapseWhitespace: true,
  conservativeCollapse: true

}

module.exports = {
  'formulae': formulaeOptions,
  'buildHtml': buildHtml,
  'questions': questions,
  'minify': minify
}
