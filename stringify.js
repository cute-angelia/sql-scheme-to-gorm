var snaketoCase = function (str) {
  var re = /_(\w)/g;
  return str.replace(re, function ($0, $1) {
    return $1.toUpperCase();
  });
}

var onfield = function (f, result) {
  var prefix = f.repeated ? 'repeated' : f.required ? 'required' : ''
  if (f.type === 'map') prefix = 'map<' + f.map.from + ',' + f.map.to + '>'
  if (f.oneof) prefix = ''

  var opts = Object.keys(f.options || {}).map(function (key) {
    return key + ' = ' + f.options[key]
  }).join(',')

  if (opts) opts = ' [' + opts + ']'

  fnameUp = f.name.replace(f.name[0], f.name[0].toUpperCase());

  var str = snaketoCase(fnameUp) + ' ' + f.type + " \`" + `json:"` + f.name + `" `;

  // gorm 内容
  str += `gorm:"`
  var gormArrays = [
    "column:" + f.name,
  ];
  if (f.auto_increment) {
    gormArrays.push("primaryKey")
    gormArrays.push("autoIncrement:true")
  }
  if (f.unsigned) {
    gormArrays.push(f.typestr + " unsigned")
  } else {
    gormArrays.push(f.typestr)
  }
  if (f.default.length > 0) {
    gormArrays.push("default:" + f.default)
  }
  if (f.comment.length > 0) {
    gormArrays.push("comment:" + f.comment)
  }

  str += gormArrays.join(";")
  str += `"`

  str += "\`"
  result.push(str)
  // add end

  //result.push((prefix ? prefix + ' ' : '') + (f.map === 'map' ? '' : f.type + ' ') + f.name + ' = ' + f.tag + opts + ';')

  return result
}

var onmessage = function (m, result) {
  result.push('type ' + snaketoCase(m.name) + 'Model struct { ')

  if (!m.enums) m.enums = []
  m.enums.forEach(function (e) {
    result.push(onenum(e, []))
  })

  if (!m.messages) m.messages = []
  m.messages.forEach(function (m) {
    result.push(onmessage(m, []))
  })

  var oneofs = {}

  if (!m.fields) m.fields = []
  m.fields.forEach(function (f) {
    if (f.oneof) {
      if (!oneofs[f.oneof]) oneofs[f.oneof] = []
      oneofs[f.oneof].push(onfield(f, []))
    } else {
      result.push(onfield(f, []))
    }
  })

  Object.keys(oneofs).forEach(function (n) {
    oneofs[n].unshift('oneof ' + n + ' {')
    oneofs[n].push('}')
    result.push(oneofs[n])
  })

  result.push('}', '')

  mNameUp = m.name.replace(m.name[0], m.name[0].toLowerCase());
  result.push(`func (` + snaketoCase(m.name) + `Model) TableName() string { `);
  result.push(`    return "` + mNameUp + `"`);
  result.push(`}`);
  result.push(``);

  return result
}

var onenum = function (e, result) {
  result.push('enum ' + e.name + ' {')
  if (!e.options) e.options = {}
  var options = onoption(e.options, [])
  if (options.length > 1) {
    result.push(options.slice(0, -1))
  }
  Object.keys(e.values).map(function (v) {
    var val = onenumvalue(e.values[v])
    result.push([v + ' = ' + val + ';'])
  })
  result.push('}', '')
  return result
}

var onenumvalue = function (v, result) {
  var opts = Object.keys(v.options || {}).map(function (key) {
    return key + ' = ' + v.options[key]
  }).join(',')

  if (opts) opts = ' [' + opts + ']'
  var val = v.value + opts
  return val
}

var onoption = function (o, result) {
  var keys = Object.keys(o)
  keys.forEach(function (option) {
    var v = o[option]
    if (~option.indexOf('.')) option = '(' + option + ')'

    var type = typeof v

    if (type === 'object') {
      v = onoptionMap(v, [])
      if (v.length) result.push('option ' + option + ' = {', v, '};')
    } else {
      if (type === 'string' && option !== 'optimize_for') v = '"' + v + '"'
      result.push('option ' + option + ' = ' + v + ';')
    }
  })
  if (keys.length > 0) {
    result.push('')
  }

  return result
}

var onoptionMap = function (o, result) {
  var keys = Object.keys(o)
  keys.forEach(function (k) {
    var v = o[k]

    var type = typeof v

    if (type === 'object') {
      if (Array.isArray(v)) {
        v.forEach(function (v) {
          v = onoptionMap(v, [])
          if (v.length) result.push(k + ' {', v, '}')
        })
      } else {
        v = onoptionMap(v, [])
        if (v.length) result.push(k + ' {', v, '}')
      }
    } else {
      if (type === 'string') v = '"' + v + '"'
      result.push(k + ': ' + v)
    }
  })

  return result
}

var onservices = function (s, result) {
  result.push('service ' + s.name + ' {')

  if (!s.options) s.options = {}
  onoption(s.options, result)
  if (!s.methods) s.methods = []
  s.methods.forEach(function (m) {
    result.push(onrpc(m, []))
  })

  result.push('}', '')
  return result
}

var onrpc = function (rpc, result) {
  var def = 'rpc ' + rpc.name + '('
  if (rpc.client_streaming) def += 'stream '
  def += rpc.input_type + ') returns ('
  if (rpc.server_streaming) def += 'stream '
  def += rpc.output_type + ')'

  if (!rpc.options) rpc.options = {}

  var options = onoption(rpc.options, [])
  if (options.length > 1) {
    result.push(def + ' {', options.slice(0, -1), '}')
  } else {
    result.push(def + ';')
  }

  return result
}

var indent = function (lvl) {
  return function (line) {
    if (Array.isArray(line)) return line.map(indent(lvl + '  ')).join('\n')
    return lvl + line
  }
}

/**
 * 
 * 
 * 

package public

type CampusModel struct {
  Id               int32  `json:"id" gorm:"primary_key"`
  Name             string `json:"name" gorm:"column:name"`
  OrganizationName string `json:"organization_name" gorm:"column:organization_name"`
  Phone            string `json:"phone" gorm:"column:phone"`
  Price            string `json:"price" gorm:"column:price"`
  Gold             string `json:"gold" gorm:"column:gold"`
  ConsumeGold      string `json:"consume_gold" gorm:"column:consume_gold"`
  FrozenGold       string `json:"frozen_gold" gorm:"column:frozen_gold"`
  CreateTime       string `json:"create_time" gorm:"column:create_time"`
  UpdateTime       string `json:"update_time" gorm:"column:update_time"`
}

func (CampusModel) TableName() string {
  return "campus"
}

 */

module.exports = function (schema) {
  var result = []

  result.push('package model', '')

  if (schema.package) result.push('package ' + schema.package + ';', '')

  if (!schema.options) schema.options = {}

  onoption(schema.options, result)

  if (!schema.enums) schema.enums = []
  schema.enums.forEach(function (e) {
    onenum(e, result)
  })

  if (!schema.messages) schema.messages = []
  schema.messages.forEach(function (m) {
    onmessage(m, result)
  })

  if (schema.services) {
    schema.services.forEach(function (s) {
      onservices(s, result)
    })
  }
  return result.map(indent('')).join('\n')
}
