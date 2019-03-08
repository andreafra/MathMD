#!/usr/bin/env node
const fs = require('fs')
const cmd = require('commander')
const marked = require('marked')
const mjpage = require('mathjax-node-page').mjpage
const chalk = require('chalk')
const md5 = require('md5')
const inq = require('inquirer')
const path = require('path')
const bs = require('browser-sync').create()
const minify = require('html-minifier').minify

const ops = require('./data')

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
    else processSettings(answers)
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

  parseMathMD(files, {
    // Options
    stylesheet: style,
    author: s.author_name,
    mathjax: format,
    watch: s.watch
  }, () => {
    // Callback
  })
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
    processSettings(answers)
  })
}

/**
 * Watch for changes on the source file and call parseMathML.
 * @param {*} files Name of the output file
 * @param {object} options JS Object of options
 * @param {function} callback Function to run at the end
 */
function parseMathMD (
  files,
  options = {
    stylesheet: undefined,
    author: 'Someone',
    mathjax: ops.formulae.node,
    watch: false
  },
  callback) {
  // Abort if there's no file to work on
  if (files[0] === undefined) {
    redError('Input file not provided!')
    return
  }
  let htmlPages = []

  if (options.watch) {
    console.log(chalk.cyan(`[🔷] Edit and save to make your browser automatically reload the preview!\n     Hit ${chalk.yellow.bgBlue(' CTRL + C ')} to stop the compiler!`))

    // Start BrowserSync static file server
    bs.init({
      server: {
        baseDir: '.',
        index: trimExt(files[0]) + '.html'
      }
    })
  }
  // Start timer
  let timeStart = Date.now()
  let fileCounter = files.length
  // Loop through each file
  for (let file of files) {
    /** Parser BEGIN */
    // Read the file data
    if (fs.existsSync(file)) {
      fs.readFile(file, { encoding: 'utf-8' }, (err, data) => {
        if (!err) {
          // convert Markdown to HTML
          let html = marked(data)
          // Parse it with MathJax and return HTML
          mjpage(html, ops.formulae.page, options.mathjax, (output) => {
            // Process output
            htmlPages.push(output)
            fileCounter -= 1
            if (fileCounter === 0) {
              // Build the html file and minify it
              let parsedHtml = minify(ops.buildHtml(trimExt(files[0]), htmlPages, options.stylesheet, options.author))
              // Save html as file
              let parsedFile = trimExt(files[0]) + '.html'
              fs.writeFile(parsedFile, parsedHtml, (err) => {
                if (err) redError(err)
                let timeElapsed = Date.now() - timeStart
                console.log(chalk.green(`[✅] Input file compiled into ${chalk.underline.white(parsedFile)} in ${timeElapsed}ms!`))
                fileCounter = files.length
                callback()
              })
            }
          })
        } else redError(err)
      })
    } else {
      yellowAlert(`${chalk.underline.white(file)} doesn't exist, I'll ignore it... 😒`)
      fileCounter -= 1
    }
    /** Parser END */
    /**  Watch START */
    if (options.watch) {
      // Very excellent guide on watching for file changes here:
      // https://thisdavej.com/how-to-watch-for-files-changes-in-node-js
      // Setup
      let md5Previous = null
      let fsWait = false

      // Start watcher
      fs.watch(file, (event, filename) => {
        if (filename) {
          if (fsWait) return
          fsWait = setTimeout(() => {
            fsWait = false
          }, 1000)
          const md5Current = md5(fs.readFileSync(file))
          if (md5Current === md5Previous) {
            return
          }
          md5Previous = md5Current
          console.log(chalk.green(`[♻️ ] ${filename} file changed, compiling...`))
          // Stop recursive
          options.watch = false
          parseMathMD(files, options, () => {
            bs.reload('*.mmd')
          })
        }
      })
    }
    /** Watch END */
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

exports.parseWithMathMD = parseMathMD
