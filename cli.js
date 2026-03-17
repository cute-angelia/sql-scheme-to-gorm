#!/usr/bin/env node
var minimist = require('minimist')
var args = minimist(process.argv.slice(2), {
  boolean: ['no-default'],
  alias: { 'nd': 'no-default' },
  default: { 'no-default': true }  // 默认 true
})

var convert = require('./')
var fs = require('fs')

var file = args._[0]  // 非选项参数
var options = {
  noDefault: args['no-default']
}

var protobuf = convert(fs.readFileSync(file).toString(), options)
process.stdout.write(protobuf)