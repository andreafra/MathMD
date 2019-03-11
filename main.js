#!/usr/bin/env node
const fs = require('fs')
const cmd = require('commander')
const marked = require('marked')
const mjpageCB = require('mathjax-node-page').mjpage
const chalk = require('chalk')
const md5 = require('md5')
const inq = require('inquirer')
const path = require('path')
const bs = require('browser-sync').create()
const minify = require('html-minifier').minify

const mjpage = (a, b, c) => new Promise((resolve, reject) => {
  mjpageCB(a, b, c, (output) => {
    if (output) resolve(output)
    else reject(new Error('Unexpected error'))
  })
})

const ops = require('./data')
const DEFAULT_OPTS = {
  stylesheet: undefined,
  author: 'Anonymous',
  mathjax: ops.formulae.node
}

/* ======================= T H E   S H E L L ======================= */
cmd
  .version('1.0.0')
  .usage('[options] <files ...>')
  .option('-a, --author <author>', 'specify an author (wrap it in quotes!)')
  .option('-s, --stylesheet <stylesheet>', 'load a custom CSS for the file')
  .option('-M, --mml', 'export with formulae in MathML')
  .option('-S, --svg', 'export with formulae as SVG')
  .option('-w, --watch', 'automatically compile when you save the file')
  .option('-i, --interactive', 'Run in interactive mode')
  .parse(process.argv)

// If there are no args passed, run as interactive shell
if (cmd.args.length > 0) {
  let settings = processSettings(cmd)
  run(settings.files, settings.options, settings.watch)
} else {
  console.log(chalk.yellow('[💡] If you run mathmd with no arguments/flags, it will run in interactive mode!'))
  interactiveMode()
}

/* ======================= F U N C T I O N S ======================= */

/**
 * Process an object of options. Can take both argv and interactive answers
 * @param {Object} input
 */
function processSettings (input) {
  let ret = {}

  ret.files = input.args || input.files.split(' ')
  ret.watch = input.watch
  ret.options = {}

  // Stylesheet
  if (input.stylesheet && fs.existsSync(input.stylesheet)) {
    console.log(chalk.green(`[✅] Custom CSS file found!`))
    ret.options.stylesheet = fs.readFileSync(input.stylesheet)
  } else {
    yellowAlert('Custom stylesheet not found! Using default one...')
    ret.options.stylesheet = fs.readFileSync(path.join(__dirname, '/default.css'))
  }

  // Output format
  if (input.mml || input.format === 'MathML') {
    ret.options.mathjax = { html: false, css: false, mml: true, svg: false }
  } else if (input.svg || input.format === 'SVG') {
    ret.options.mathjax = { html: false, css: false, mml: false, svg: true }
  } else {
    ret.options.mathjax = ops.formulae.node
  }

  // Author
  ret.options.author = input.author || 'Anonymous'

  return ret
}

function interactiveMode () {
  console.log('')
  console.log((chalk.white.bgRed('  ╔╦╗┌─┐┌┬┐┬ ┬╔╦╗╔╦╗ ')))
  console.log((chalk.white.bgRed('  ║║║├─┤ │ ├─┤║║║ ║║ ')))
  console.log((chalk.white.bgRed('  ╩ ╩┴ ┴ ┴ ┴ ┴╩ ╩═╩╝ ')))
  console.log(chalk.bgWhite.black(' Use CTRL+C to exit. '))
  console.log('')

  const prompt = inq.createPromptModule()
  prompt(ops.questions).then(answers => {
    let settings = processSettings(answers)
    run(settings.files, settings.options, settings.watch)
  })
}

/**
 * Do the stuff ༼ つ ◕_◕ ༽つ
 * @param {*} files Name of the output file
 * @param {object} options JS Object of options
 * @param {boolean} watch Watch for file changes and auto-refresh
 * @param {function} callback Function to run at the end
 */
async function run (files, options = DEFAULT_OPTS, watch = false, callback) {
  await parseMathMD(files, options, callback)
  if (watch) { watchForChanges(files, options) }
}

/**
 * Parse md files and write the resulting html file to disk
 * @param {*} files Name of the output file
 * @param {object} options JS Object of options
 * @param {function} callback Function to run at the end
 */
async function parseMathMD (files, options, callback) {
  // Abort if there's no file to work on
  if (files[0] === undefined) {
    redError('Input file not provided!')
    return
  }

  let htmlPages = []
  let timeStart = Date.now()

  // Parse files
  for (let file of files) {
    if (!fs.existsSync(file)) {
      yellowAlert(`${chalk.underline.white(file)} doesn't exist, I'll ignore it... 😒`)
      return
    }

    try {
      // Read the file data
      let data = fs.readFileSync(file, { encoding: 'utf-8' })
      // convert Markdown to HTML
      let html = marked(data)
      // Parse it with MathJax and return HTML
      let output = await mjpage(html, ops.formulae.page, options.mathjax)
      htmlPages.push(output)
    } catch (err) {
      redError(err)
    }
  }

  // Build the html file and minify it
  let parsedHtml = minify(ops.buildHtml(trimExt(files[0]), htmlPages, options.stylesheet, options.author))
  // Save html as file
  let outFile = trimExt(files[0]) + '.html'
  try {
    fs.writeFileSync(outFile, parsedHtml)
    let timeElapsed = Date.now() - timeStart
    console.log(chalk.green(`[✅] Input file compiled into ${chalk.underline.white(outFile)} in ${timeElapsed}ms!`))
  } catch (err) {
    redError(err)
  }

  if (callback) { callback() }
}

function watchForChanges (files, options) {
  console.log(chalk.cyan(`[🔷] Edit and save to make your browser automatically reload the preview!\n     Hit ${chalk.yellow.bgBlue(' CTRL + C ')} to stop the compiler!`))

  // Start BrowserSync static file server
  bs.init({
    server: {
      baseDir: path.dirname(files[0]),
      index: trimExt(files[0]) + '.html'
    }
  })

  let refresh = false
  setInterval(async () => {
    if (refresh) {
      refresh = false

      console.log(chalk.green(`[♻️ ] Detected change in the input file(s), compiling...`))
      await parseMathMD(files, options)
      bs.reload('*.html')
    }
  }, 1000)

  let md5s = Array(files.length)
  for (let i = 0; i < files.length; i++) {
    // Excellent guide on watching for file changes here:
    // https://thisdavej.com/how-to-watch-for-files-changes-in-node-js

    fs.watch(files[i], async (event, filename) => {
      if (!filename) return

      const md5Current = md5(fs.readFileSync(files[i]))
      if (md5Current !== md5s[i]) {
        md5s[i] = md5Current
        refresh = true
      }
    })
  }
}

function redError (msg) {
  console.log(chalk.red(`[❌] ${msg}`))
}

function yellowAlert (msg) {
  console.log(chalk.yellow(`[⚠️ ] ${msg}`))
}

function trimExt (file) {
  return file.replace(/\.[^/.]+$/, '')
}

exports.parseWithMathMD = run
