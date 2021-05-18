const fs = require('fs');
const path = require('path');
const config = process.env.npm_config_c && require(`./${process.env.npm_config_c}`) || require("./config.json");

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
      return null;

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
    for(let r=0; r<values.length; r++) {
      for(let i=0; i<values[r].length; i++) {
        if(!types[i] || !types[i].type)
          continue;
        try {
          switch(types[i].type) {
            case "number":
              values[r][i] = Number(values[r][i]);
              break;
            case "array":
              values[r][i] = values[r][i].split(types[i].delimiter || ',');
              break;
            case "bool":
            case "boolean":
              let valueForTrue = types[i].true.toLowerCase();
              values[r][i] = values[r][i] && values[r][i].toLowerCase() === valueForTrue;
              break;
            case "date":
              // TODO: include format string to convert properly
              break;
            default:
              break;
          }
        } catch(err) {}
      }
    }
    return values;
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
    if(typeof type === 'string')
      return value;
    else if(value.length === 0) {
      if(type.default != undefined)
        return type.default;
      // TODO: Maybe infer default values based on types?
      return null;
    }
    return value;
  }

  const convertToJSON = (values, headers) => {
    const json = [];
    for(value of values) {
      const obj = {};
      for(let i=0; i<value.length; i++) {
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
  let values = parseCSV();
  let headers;

  values = ignoreLines(values);

  if(config.alignment.toLowerCase() === 'h')
    values = transpose(values);

  if(config.headers) {
    headers = config.headers;
  } else {
    headers = values[0];
    values = values.slice(1);
  }

  values = castTypes(values, headers);

  let json = convertToJSON(values, headers);

  if(config.trim)
    json = trimJSON(json);

  saveToFile(json);
})();