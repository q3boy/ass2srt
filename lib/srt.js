'use strict';
const fs = require('graceful-fs');
const path = require('path');


const padLeft = function(num) {
  num = parseInt(num).toString()
  if (num.length < 2) {
    num = '0'+num
  }
  return num
}
const padRight = function(num) {
  return Math.floor(num * 1000)
}

const ts2time = function(ts) {
  return `${padLeft(ts.hour)}:${padLeft(ts.minute)}:${padLeft(ts.second)},${padRight(ts.msecond)}`
}

const writeFile = function(file, subtitles) {
  let str = subtitles.map((d,idx)=>`${idx+1}\r\n${ts2time(d.start)} --> ${ts2time(d.end)}\r\n${d.text}\r\n\r\n`).join('')
  fs.writeFileSync(file, str)
}

module.exports = writeFile
