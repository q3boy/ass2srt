'use strict';
const EventEmitter = require('events');
const util = require('util');
const watchr = require('watchr');
const path = require('path');


class Watch extends EventEmitter{

  start(dir) {

    watchr.watch({
      paths:[dir],
      catchupDelay : 5000,
      listeners: {
        log: () => this.emit('log', arguments),
        error : err => this.emit('error', err),
        change : (type, file, stat) => {
          if (type === 'delete' || !stat.isFile() || path.extname(file).toLowerCase() !== '.ass') {
            return
          }
          this.emit('got', file, stat)
        }
      },
      next : (err, watchers) => {
        if(err) {
          return this.emit('error', err)
        }
        this.watchers = watchers
        this.emit('watching')
      }
    })
  }
  stop() {
    if (!this.watchers) {
      return
    }
    this.watchers.forEach(w=>w.close())
  }
}
module.exports = function(dir) {
  return new Watch()
}
