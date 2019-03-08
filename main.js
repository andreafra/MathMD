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
  author: 'Someone',
  mathjax: ops.formulae.node
}

cmd
  .version('1.0.0')
  .usage('[options] <file>')
  .arguments('<input> [otherFiles...]')
  .option('-a, --author [author]', 'specify an author (wrap it in quotes!)')
  .option('-s, --stylesheet [stylesheet]', 'load a custom CSS for the file')
  .option('-M, --mml', 'export with formulae in MathML')
  .option('-S, --svg', 'export with formulae as SVG')
  .option('-w, --watch', 'automatically compile when you save the file')
  .option('-i, --interactive', 'Run in interactive mode')
  .action((file, otherFiles) => {
    let answers = {}
    if (file) answers.input_files = file
    else console.log(redError('Input file not found!'))
    if (otherFiles.length > 0) answers.input_files = [file].concat(otherFiles)
    if (cmd.stylesheet) answers.stylesheet_name = cmd.stylesheet
    if (cmd.mml) answers.output_format = 'MathML'
    if (cmd.svg) answers.output_format = 'SVG'
    answers.watch = cmd.watch
    if (cmd.author) answers.author_name = cmd.author
    else answers.author_name = 'MathMD Document'
    if (cmd.interactive) interactiveMode()
    else {
      let settings = processSettings(answers)
      run(settings.files, settings.options, settings.watch)
    }
  })
  .parse(process.argv)

// If there are no args passed, ask the user
// if it wants to do an interactive setup
if (cmd.args.length <= 1) {
  console.log(chalk.yellow('[💡] If you run mathmd with no arguments/flags, it will run in interactive mode!'))

  interactiveMode()
}

function processSettings (s) {
  var files, style, format
  if (typeof s.input_files === 'string') {
    let inputAsArray = s.input_files.split(' ')
    for (let i = 0; i < inputAsArray.length; i++) {
      if (inputAsArray[i] === '') {
        inputAsArray.splice(i, 1)
      }
    }
    s.input_files = inputAsArray
    console.log(s.input_files)
  }
  files = s.input_files
  if (files.length < 1) return
  if (fs.existsSync(s.stylesheet_name)) {
    console.log(chalk.green(`[✅] Custom CSS file found!`))
    style = fs.readFileSync(s.stylesheet_name)
  } else {
    yellowAlert('Custom stylesheet not found! Using default one...')
    style = fs.readFileSync(path.join(__dirname, '/default.css'))
  }

  switch (s.output_format) {
    case 'MathML':
      format = { html: false, css: false, mml: true, svg: false }
      break
    case 'SVG':
      format = { html: false, css: false, mml: false, svg: true }
      break
    default:
      format = ops.formulae.node
      break
  }

  let ret = {}
  ret.files = files
  ret.watch = s.watch
  ret.options = {
    stylesheet: style,
    author: s.author_name,
    mathjax: format
  }

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

  // Excellent guide on watching for file changes here:
  // https://thisdavej.com/how-to-watch-for-files-changes-in-node-js

  for (let file of files) {
    let md5Previous = null
    let fsWait = false

    // Start watcher
    fs.watch(file, async (event, filename) => {
      if (!filename || fsWait) return
      fsWait = true // should queue it up instead
      setTimeout(
        () => { fsWait = false }
        , 1000
      )

      const md5Current = md5(fs.readFileSync(file))
      if (md5Current !== md5Previous) {
        console.log(chalk.green(`[♻️ ] ${filename} file changed, compiling...`))
        await parseMathMD(files, options)
        bs.reload('*.html')

        md5Previous = md5Current
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
