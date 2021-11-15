import axios from "axios";
import fs from "fs";
import request from "request";
import path from "path";
const postcss = require('postcss');
const processed = Symbol('processed')
const fontConverter = require('font-converter');


const woff2UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.54 Safari/537.36'
// const woffUA = 'Mozilla/5.0 (iPad; CPU OS 6_0 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Version/6.0 Mobile/10A5355d Safari/8536.25'

export const getBodyFromUrl = async (url, userAgent = woff2UA) => {
  return axios.get(url, {
    headers: {
      'user-agent': userAgent
    }
  })
}

export const clearDir = (directory) => {
  fs.readdir(directory, (err, files) => {
    if (err) throw err;

    for (const file of files) {
      fs.unlink(path.join(directory, file), err => {
        if (err) throw err;
      });
    }
  });
}

export const getFileData = (url) => {
  const regexpGetName = /\/(?<filename>[^\/]+)\.(?<ext>[\w]+)$/
  const parsed = regexpGetName.exec(url)
  if (parsed) {
    return {...parsed.groups}
  }
  return { filename: null, ext: null }
}

export const getValueAndResultUrl = async (url, baseUrl = '../') => {
  const regexGetUrl = /url\((?<src>[^);]*)/
  const parsed = regexGetUrl.exec(url)
  const {filename} = await getFileData(parsed.groups.src)
  if  (!filename) {
    return { filename: null, value: null }
  }
  return {
    src: parsed.groups.src,
    filename,
    value: `url('${baseUrl}${filename}.woff2') format('woff2'), url('${baseUrl}${filename}.woff') format('woff')`
  }
}

export const download = (url, dest) => {
  const file = fs.createWriteStream(dest);

  return new Promise((resolve, reject) => {
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

const plugin = (ctx) => {
  return {
    postcssPlugin: 'changeUrls',
    async Declaration(decl, {result}) {
      if (decl[processed]) {
        return
      }
      if (decl.prop === 'src') {
        const { filename, value, src } = await getValueAndResultUrl(decl.value, ctx.dest)
        if (value) {
          decl.value = value
          decl[processed] = true
          result.messages.push({
            src,
            filename
          })
        }
      }
    },
  }
}
plugin.postcss = true

export const modifyAST = async (data, options = {}) => {
  return await postcss([plugin(options)])
    .process(data, {from: undefined, options})
    .then(res => {
      return {
        files: res.messages,
        css: res.css
      }
    })
}

export const createCss = (path, css) => {
  fs.writeFile(path, css, {flag: 'wx'}, function (err) {
    if (err) {
      console.log(err)
    }
    console.log("It's saved!");
  });
}

fontConverter("path/to/sourceFontFile.ttf", "path/to/destinationFontFile.woff", function (err) {
  if(err) {
    // There was an error
  } else {
    // All good, path/to/destinationFontFile.woff contains the transformed font file
  }
})