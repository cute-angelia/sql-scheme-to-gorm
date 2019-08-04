var stringifyObj = require('./stringify')

var mappings = {
  'bigint': 'int64',
  'integer': 'int32',
  'text': 'string',
  'real': 'float',
  'date': 'string',
  'boolean': 'bool'
}

// from https://github.com/michalbe/sql-create-table-to-json/blob/master/index.js
var removeComments = function (data) {
  data = data.replace(/\/\*(.*)/g, '').replace(/([ \t]*\n){3,}/g, '\n\n');
  return data;
}

module.exports = function (data) {
  var data = removeComments(data)
  var schemas = data.split('\n\n')

  var result = {
    syntax: 3,
    package: null,
    enums: [],
    messages: []
  }
  schemas.forEach(function (schema) {
    var match = schema.match(/.*CREATE\s+TABLE\s+(IF\s+NOT\s+EXISTS)?[\s+]?([\S|\`]+).*/i);
    if (match) {
      var tableName = normalize(match[2])
      tableName = tableName.substring(0, 1).toUpperCase() + tableName.substring(1);

      var fields = schema.substring(schema.indexOf('(')).trim()
      fields = fields.replace(/^\(/g, '').replace(/\);?$/g, '')
      result.messages.push(Message(tableName, fields))
    }
  })
  //console.log(result, result.messages[0].fields)

  return stringifyObj(result)
}

function Message(name, fields) {
  var message = {
    name: name,
    enums: [],
    messages: [],
    fields: []
  }

  var lines = fields.split(/,[$|\"|\`|\'|\s+]/i);

  var tag = 0

  var newLines = [];
  // 过滤 line
  for (var v in lines) {
    if (lines[v].indexOf('PRIMARY') > 0) {
      continue;
    }
    if (lines[v].indexOf('UNIQUE') > 0) {
      continue;
    }
    if (lines[v].indexOf('KEY') > 0) {
      continue;
    }
    if (lines[v].indexOf('`') === -1) {
      continue;
    }
    var temps = lines[v].trim().split(/\s+/)
    if (temps.length <= 1 || temps[0].indexOf(")") > 0) {
      continue;
    }

    newLines.push(lines[v]);
  }

  message.fields = newLines.map(function (line) {
    tag += 1
    return Field(line, tag)
  });

  return message
}

function Field(data, tag) {
  var field = {
    name: null,
    type: null,
    tag: tag,
    repeated: false
  }

  var tokens = data.trim().split(/\s+/)

  //console.log(tokens);

  field.name = normalize(tokens[0])

  // mysql
  var imap = '';
  if (typeof (tokens[1]) != "undefined") {

    if (tokens[1].indexOf('int') >= 0) {
      for (var v in tokens) {
        if (tokens[v] == 'unsigned') {
          imap = 'uint32';
        }
      }
      imap = imap || 'int32';
    }

    if (tokens[1].indexOf('long') >= 0) {
      for (var v in tokens) {
        if (tokens[v] == 'unsigned') {
          imap = 'uint64';
        }
      }
      imap = imap || 'int64';
    }

    if (tokens[1].indexOf('datetime') >= 0 || tokens[1].indexOf('timestamp') >= 0) {
      imap = 'string';
    }

    if (tokens[1].indexOf('float') >= 0) {
      imap = 'float';
    }

    if (tokens[1].indexOf('double') >= 0) {
      imap = 'double';
    }

    if (tokens[1].indexOf('varchar') >= 0 || tokens[1].indexOf('text') >= 0) {
      imap = 'string';
    }

  }

  field.type = imap || 'string'

  // if (data.match(/.*NOT\s+NULL.*/i)) {
  //   field.required = true
  // }
  // var default_match = data.match(/.*DEFAULT\s+(\S+).*/i)
  // if (default_match) {
  //   field.options.default = default_match[1]
  // }

  return field
}

function normalize(string) {
  return string.replace(/['`"]/ig, '')
}