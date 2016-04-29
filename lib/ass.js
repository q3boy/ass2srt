'use strict';
const fs = require('graceful-fs');
const iconv = require('iconv-lite');
const detect = require('charset-detector');

const UTF8 = 'UTF-8'
const REG_SECTION = /^\[\w+\]$/
const REG_TEXT_MARK = /\{[^\}]*?\}/g
const REG_TEXT_NEWLINE = /\\n/ig
const REG_TEXT_STRIP = /\{[^\}]*\\(move|pos)\b[^\}]*\}/ig

const REG_TIME = /^(\d+):(\d+):(\d+).(\d+)$/

const time2ts = function(time) {
  let res = time.match(REG_TIME);
  if (!res) {
    return null
  }
  let hour = parseInt(res[1])
  let minute = parseInt(res[2])
  let second = parseInt(res[3])
  let msecond = parseFloat(`0.${res[4]}`)
  let ts = hour*60*60 + minute*60 + second + msecond
  return {time, hour, minute, second, msecond, ts}
}

class Ass {
  constructor (file){
    this.file = file
    this.read().parse()
  }
  read(){
    let buf = fs.readFileSync(this.file)
    let charset = detect(buf)
    try {
      charset = charset[0].charsetName
    } catch (e) {
      throw new Error(`Can't detect charset for file "${file}".`)
    }
    this.lines = (charset !== UTF8 ? iconv.decode(buf, charset) : buf.toString()).replace(/\r/g, '')
      .split("\n")
      .map(d=>d.trim())
      .filter(d=>d!=='')
    return this
  }

  parse() {
    let begin = this.lines.indexOf('[Events]');
    if (begin === -1) {
      throw new Error(`Can't find subtitle in file "${file}"`);
    }

    this.parseLabel(this.lines[begin+1])
    let subtitles = []

    for(let i = 0, lines = this.lines.slice(begin+2); i < lines.length; i++) {
      let line = lines[i]
      if (line.match(REG_SECTION)) {
        break
      }
      line = this.parseLine(line)
      if (line !== null) {
        subtitles.push(line)
      }
    }
    this.subtitles = subtitles.sort((a,b)=>a.start.ts-b.start.ts)
  }
  parseLabel(line) {
    let keys = []
    let reg = line
      .replace(/\s/g, '')
      .replace(/\w+/g, (txt)=>{
        keys.push(txt.toLowerCase()); return '\\s*(.*?)\\s*'
      })
    reg = new RegExp(`^${reg}$`)
    this.label = {reg, keys}
  }
  parseText(rawText) {
    if (rawText.match(REG_TEXT_STRIP)) {
      return null
    }
    let text = rawText
      .replace(REG_TEXT_MARK, '')
      .replace(REG_TEXT_NEWLINE, "\n")
      .replace(/^\s+/gm, "")
      .replace(/\s+$/gm, "")
      .replace(/\n{2}/g, "\n")
      .trim()
    if (text === '') {
      return null
    }
    return text.replace(/\n/g, '\r\n')
  }
  parseLine(line) {
    let keys = this.label.keys
    let res = line.match(this.label.reg)
    if (!res) {
      return null
    }
    let obj = {}
    for(let i = 1; i <= keys.length; i++) {
      let key = keys[i-1], part = res[i]
      obj[key] = part
    }
    let text = this.parseText(obj.text)
    let start = time2ts(obj.start)
    let end = time2ts(obj.end)
    if (text && start && end) {
      return {text, start, end}
    }
    return null

  }
}
module.exports = function(file) {
  return new Ass(file).subtitles
}
// let begin = str.indexOf('[Events]')


