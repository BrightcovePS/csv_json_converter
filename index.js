const fs = require('fs');
const path = require('path');
const config = process.env.npm_config_config && require(path.join(__dirname, process.env.npm_config_config)) || require('./config.json');

module.exports = (async () => {
  const openFile = () => {
    return fs.readFileSync(path.join(__dirname, config.inputFile), 'utf8');
  }

  const ignoreLines = (values) => {
    if(config.skipRows && !isNaN(config.skipRows)) {
      values = values.slice(config.skipRows);
    }
    if(config.skipColumns && !isNaN(config.skipColumns)) {
      for(let i=0; i<values.length; i++) {
        values[i] = values[i].slice(config.skipColumns);
      }
    }
    return values;
  };

  const transpose = (values) => {
    const tValues = [];
    const numRows = values.length;
    const numColumns = values[0].length;

    for(let c=0; c<numColumns; c++) {
      const row = [];
      for(let r=0; r<numRows; r++) {
        row.push(values[r][c]);
      }
      tValues.push(row);
    }
    return tValues;
  }

  const trimJSON = (arr) => {
    let jsonArr = arr.slice();
    let i=0;
    while(i<jsonArr.length) {
      let json = jsonArr[i];
      let empty = true;
      for(let key in json) {
        if(json[key] !== '') {
          empty = false;
          break;
        }
      }
      if(empty)
        jsonArr.splice(i, 1);
      else
        i++;
    }
    return jsonArr;
  }

  const getValue = (data, start, end) => {
    let value = data.substring(start, end);

    // Clean up leading/trailing quotes
    if(value[0] === '"' && value[value.length - 1] === '"')
      value = value.substring(1, value.length - 1);

    // Clean up instances of just comma
    if(value === ',')
      value = '';

    // Ignore carriage returns
    if(value === '\r')
      return '';

    // Remove carriage returns
    value = value.replace(/\r/g, '');

    return value;
  }

  const parseCSV = () => {
    const values = [];
    let valueStart = 0;
    let quoteMatches = 0;
    let objValues = [];

    for(let i=0; i<data.length; i++) {
      if(data[i] == '"') {
        quoteMatches++;
      }
      if(data[i] === config.delimiter || data[i] === '\n' || i === data.length - 1) {
        // Ensure the delimiter is ignored within a quoted section
        if(quoteMatches % 2 !== 0) {
          continue;
        }
        else {
          const value = getValue(data, valueStart, i);
          if(value !== null)
            objValues.push(value);
          valueStart = i + 1;
          quoteMatches = 0;

          if(data[i] === '\n' || i === data.length - 1) {
            if(i === data.length - 1) {
              const value = getValue(data, valueStart, i);
              if(value !== null)
                objValues.push(value);
            }
            values.push(objValues);
            objValues = [];
          }
        }
      }
    }
    return values;
  }

  const castTypes = (values, types) => {
    const fillerMarker = '__filler__';

    for(let i=0; i<types.length; i++) {
      if(types[i].type === 'custom' && Number(types[i].span) > 1) {
        for(j=1; j<types[i].span; j++)
          types.splice(i + j, 0, fillerMarker);
        i += types[i].span;
      }
    }

    for(let r=0; r<values.length; r++) {
      for(let i=0; i<values[r].length; i++) {
        if(types[i] === fillerMarker)
          values[r][i] = fillerMarker;
        else if(!types[i] || !types[i].type)
          continue;
        else {
          try {
            switch(types[i].type) {
              case 'number':
                values[r][i] = Number(values[r][i]);
                break;
              case 'array':
                let delimiter = types[i].delimiter || ',';
                values[r][i] = values[r][i].includes(delimiter) || values[r][i] ? values[r][i].split(delimiter) : values[r][i];
                break;
              case 'bool':
              case 'boolean':
                let valueForTrue = types[i].true.toLowerCase();
                values[r][i] = values[r][i] ? values[r][i].toLowerCase() === valueForTrue : values[r][i];
                break;
              case 'custom':
                if(typeof types[i].transform === 'function')
                  values[r][i] = types[i].transform(values[r][i], i, values[r]);
                break;
              default:
                break;
            }
          } catch(err) {}
        }
      }
      values[r] = values[r].filter(v => v !== fillerMarker);
    }

    types = types.filter(t => t !== fillerMarker);

    return { values, headers: types };
  }

  const parseHeader = (header) => {
    if(typeof header === 'string')
      return header;
    else if(typeof header === 'object' && header.name)
      return header.name;
    else
      throw 'Malformed header in config';
  }

  const getJSONValue = (value, type) => {
    if(typeof type === 'string' || value === null)
      return value;
    else if(value.length === 0) {
      if(type.default != undefined)
        return type.default;
      switch(type.type) {
        case 'custom':
          return value;
        case 'string':
          return '';
        case 'number':
          return 0;
        case 'array':
          return []
        case 'bool':
        case 'boolean':
          return false;
        default:
          return null;
      }
    }
    return value;
  }

  const convertToJSON = (values, headers) => {
    const json = [];
    for(value of values) {
      const obj = {};
      for(let i=0; i<value.length; i++) {
        if(headers[i] == undefined)
          continue;
        const k = parseHeader(headers[i]);
        const v = getJSONValue(value[i], headers[i]);
        obj[k] = v;
      }
      json.push(obj);
    }
    return json;
  }

  const saveToFile = (json) => {
    const jsonString = JSON.stringify(json, null, 4);
    fs.writeFile(path.join(__dirname, config.outputFile), jsonString, err => {
      if(!err)
        console.log('Wrote to file');
    });
  }

  const data = openFile();
  var values = parseCSV();
  var headers;

  values = ignoreLines(values);

  if(config.alignment.toLowerCase() === 'h')
    values = transpose(values);

  if(config.headers) {
    headers = config.headers;
  } else {
    headers = values[0];
    values = values.slice(1);
  }

  var { values, headers } = castTypes(values, headers);

  let json = convertToJSON(values, headers);

  if(config.trim)
    json = trimJSON(json);

  saveToFile(json);
})();