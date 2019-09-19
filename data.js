const questions = [
  {
    type: 'input',
    name: 'files',
    message: 'Insert the path to the source file(s) (Space is a separator):\n'
  },
  {
    type: 'list',
    name: 'format',
    message: 'Choose the output format for your formulae:',
    choices: [
      'MathML',
      'SVG'],
    default: 0
  },
  {
    type: 'input',
    name: 'stylesheet',
    message: '[Optional] Insert a path to an external stylesheet:'
  },
  {
    type: 'input',
    name: 'author',
    message: '[Optional] Author:'
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
