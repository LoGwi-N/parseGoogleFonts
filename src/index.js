const request = require('request');
import * as csstree from 'css-tree';

const fs = require('fs');
const path = require('path');

const userAgentWoff2 = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.54 Safari/537.36'
// const userAgentWoff = 'Mozilla/5.0 (iPad; CPU OS 6_0 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Version/6.0 Mobile/10A5355d Safari/8536.25'

const URL_PARSE = 'http://fonts.googleapis.com/css2?family=Roboto:wght@100;300;400;500;700&display=swap'

// const URL_PARSE = path.resolve(__dirname, '../', 'input', 'input.css')
const fontsDir = path.resolve(__dirname, '../', 'dist', 'fonts')
const fontsCssFile = path.resolve(__dirname, '../', 'dist', 'fonts.css')

// const regexCSS = /\/\*\s+(?<name>[\w-]+)\s+\*\/[\n\r]+@font-face\s*\{(?<body>[^}]*)\}/igs;
// const regex = /\/\*\s+(?<name>[\w-]+)\s+\*\/[\n\r]+@font-face\s*\{(?<body>[^}]*)\}/isg;
const regex = /@font-face\s*\{(?<body>[^}]*)\}/isg;
const regexFont = /font-family:\s*(?<family>[^;]*).*font-style:\s*(?<style>[^;]*).*font-weight:\s*(?<weight>[^;]*).*font-display:\s*(?<display>[^;]*).*src:\s*url\((?<src>[^);]*).*unicode-range:\s*(?<unicode>[^;]*)/isg;

function clearDir(directory) {
  fs.readdir(directory, (err, files) => {
    if (err) throw err;

    for (const file of files) {
      fs.unlink(path.join(directory, file), err => {
        if (err) throw err;
      });
    }
  });
}

function clearFontCssFile(filename) {
  fs.unlink(filename, err => {
    if (err) throw err;
  });
}

async function download(url, dest) {
  const file = fs.createWriteStream(dest);

  return  new Promise((resolve, reject) => {
    request({
      uri: url,
      gzip: true,
    })
      .pipe(file)
      .on('finish', async () => {
        resolve();
      })
      .on('error', (error) => {
        reject(error);
      });
  })
    .catch((error) => {
      console.log(`Something happened: ${error}`);
    });
}

function getFileData(url) {
  const regexpGetName = /\/(?<filename>[^\/]+)\.(?<ext>[\w]+)$/
  const parsed = regexpGetName.exec(url)
  return {
    name: parsed.groups.filename,
    ext: parsed.groups.ext
  }
}

async function parseCss(css) {
  const ast = csstree.parse(css, {
    parseAtrulePrelude: false,
    parseRulePrelude: false
  });

  const astPlained = csstree.toPlainObject(ast)

  await csstree.walk(astPlained, {
    visit: 'Declaration',
    async enter(node) {

      if (node.property === 'src') {

        const urlObject = node.value.children.find(el => el.type === 'Url') ?? null
        const formatObject = {...node.value.children.find(el => el.type === 'Function')}


        console.log(formatObject)

        // console.log(urlObject)

        const fontUrl = urlObject.value?.value ?? null

        if (urlObject) {
          const {name, ext} = getFileData(urlObject.value?.value)

          const destPath = path.resolve(fontsDir, `${name}.${ext}`)
          download(fontUrl, destPath).then(r => {

          })

          urlObject.value.value = '../assets/fonts/Roboto/' + `${name}.${ext}`
        }

        node.value.children = [
          ...node.value.children,
          { type: 'Operator', loc: null, value: ',' },
          urlObject,
          { type: 'WhiteSpace', loc: null, value: ' ' },
          formatObject
        ]

      }
    }
  })

  return await csstree.generate(ast)
}

clearDir(fontsDir)
clearFontCssFile(fontsCssFile)

request(
  {
    url: URL_PARSE,
    headers: {'User-Agent': userAgentWoff2}
  },
  async function (error, response, body) {
    if (!error && response.statusCode === 200) {

      const cssResult = await parseCss(body)

      // fs.writeFileSync(path.resolve(__dirname, '../', 'dist', 'fonts.css'), cssResult);

      fs.writeFile(fontsCssFile, cssResult, { flag: 'wx' }, function (err) {
        if (err) {
          console.log(err)
        }
        console.log("It's saved!");
      });

    } else {
      console.log('Error request')
    }
  });

// fs.readFile(URL_PARSE, 'utf8', (err, data) => {
//   if (err) {
//     console.error(err)
//     return
//   }
//   parseCssFromString(data)
// })