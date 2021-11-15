import {clearDir, createCss, download, getBodyFromUrl, modifyAST} from "./common/functions";
import dotenv from "dotenv";

const fs = require('fs');
const path = require('path');

const result = dotenv.config()

if (result.error) {
  throw result.error
}

const URL_TO_PARSE = result.parsed.URL
const DEFAULT_PATH = result.parsed.DEFAULT_PATH ?? '../'

if  (URL_TO_PARSE) {
  const fontsDir = path.resolve(__dirname, '../', 'dist', 'fonts')
  const fontsCssFile = path.resolve(__dirname, '../', 'dist', 'fonts.css')

  clearDir(fontsDir)
  fs.unlink(fontsCssFile, () => {

  })

  getBodyFromUrl(URL_TO_PARSE)
    .then(res => res.data)
    .then(res => {
      modifyAST(res, {dest: DEFAULT_PATH}).then(r => {
        createCss(fontsCssFile, r.css)
        r.files.forEach(el => download(el.src, path.resolve(fontsDir, `${el.filename}.woff2`)))
      })
    })
    .catch(e => {
      console.log('Error to get data from URL: ', e)
    })

}