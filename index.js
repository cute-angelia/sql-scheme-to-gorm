var stringifyObj = require('./stringify')

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

  // console.log(result, result.messages[0].fields)

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
    repeated: false,
    default: undefined, // 默认
    comment: "", // 注释
    auto_increment: false, // 自增
    unsigned: false,
    typestr: "", // 数据库类型
  }

  var tokens = createStatusArray(data.trim())

  // console.log(tokens);

  field.name = normalize(tokens[0])

  // mysql 类型
  var imap = getType(tokens);

  field.type = imap || 'string'
  field.typestr = tokens[1]

  // if (data.match(/.*NOT\s+NULL.*/i)) {
  //   field.required = true
  // }
  // var default_match = data.match(/.*DEFAULT\s+(\S+).*/i)
  // if (default_match) {
  //   field.options.default = default_match[1]
  // }

  for (let i = 0; i < tokens.length; i += 2) {
    if (tokens[i] == "DEFAULT") {
      var defaultValue = tokens[i + 1];
      if (defaultValue != "NULL") {
        if (field.type.indexOf("int") >= 0) {
          defaultValue = defaultValue.replace(/[^0-9]/g, '');
          defaultValue = defaultValue * 1
        }
        field.default = defaultValue;
      }
    }

    if (tokens[i] == "COMMENT") {
      field.comment = tokens[i + 1];
    }

    if (tokens[i] == "unsigned") {
      field.unsigned = true
    }

    if (tokens[i] == "AUTO_INCREMENT") {
      field.auto_increment = true
    }
  }

  // console.log(field)

  return field
}


var mappings = {
  'integer': 'int32',
  'int': 'int32',
  'tinyint': 'int32',

  'mediumint': 'int64',
  'bigint': 'int64',
  'timestamp': 'int64',

  'double': 'float64',
  'decimal': 'float64',
  'float': 'float64',

  'date': 'string',
  'varchar': 'string',
}

// 分隔 createStatusArray
function createStatusArray(statusString) {
  return statusString.match(/('[^']*'|`[^`]*`|\S+)/g);
}

function getType(tokens) {
  const typestr = tokens[1] || ""
  if (typestr.length == 0 || typeof (typestr) == "undefined") {
    return "string"
  }
  var typesplict = typestr.split("(")

  // 类型
  const type = typesplict[0]

  // 是否可以负数
  var isUnsigned = false
  for (var v in tokens) {
    if (tokens[v] == 'unsigned') {
      isUnsigned = true
    }
  }
  var imap = mappings[type] || 'string';
  if (isUnsigned && imap.indexOf('int') >= 0) {
    imap = 'u' + imap
  }
  // console.log(imap, type);
  return imap
}

function normalize(string) {
  return string.replace(/['`"]/ig, '')
}

// tokens 示例
// ['`id`', 'int(11)', 'NOT', 'NULL', 'AUTO_INCREMENT']
// ['`username`', 'varchar(50)', 'DEFAULT', 'NULL']
// ['`nickname`', 'varchar(80)', 'DEFAULT', 'NULL']
// [
//   '`last_post_id`',
//   'bigint(20)',
//   'DEFAULT',
//   "'0'",
//   'COMMENT',
//   "'泡泡最后id'"
// ]
// ['`bucket`', 'varchar(30)', 'DEFAULT', 'NULL']
// ['`object_dir`', 'varchar(80)', 'DEFAULT', 'NULL']
// [
//   '`status`',
//   'tinyint(2)',
//   'DEFAULT',
//   "'1'",
//   'COMMENT',
//   "'1:on;",
//   '0',
//   ":off'"
// ]
// ['`dateline`', 'datetime', 'DEFAULT', 'NULL']