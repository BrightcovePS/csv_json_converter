const fs = require('fs');
const path = require('path');
const config = require("./config.json");

module.exports = (async () => {
  const dataWithIgnores = (str) => {
    let rows = str.split('\n');

    if(config.ignoreRows) {
      rows = rows.slice(config.ignoreRows, rows.length);
    }
    if(config.ignoreColumns) {
      console.log(rows[0].length);
      for(let i=0; i<rows.length; i++)
        rows[i] = rows[i].substring(config.ignoreColumns, rows[i].length);
    }
    return rows.join('\n');
  }

  const openFile = () => {
    let data = fs.readFileSync(path.join(__dirname, config.inputFile), 'utf8');

    if(config.alignment === 'VERTICAL')
      data = transpose(data);

    const tFilename = config.inputFile.replace('.csv', '') + '_transposed.csv';
    fs.writeFileSync(path.join(__dirname, tFilename), data);

    data = dataWithIgnores(data);

    return data;
  }

  const transpose = (str) => {
    const rows = str.split('\n');
    let newStr = '';

    for(let i=0; i<rows[0].length; i++) {
      for(let r=0; r<rows.length; r++) {
        newStr += rows[r][i];
      }
    }

    return newStr;
  }

  const getValue = (data, start, end) => {
    let value = data.substring(start, end);

    // Clean up leading/trailing quotes
    if(value[0] === '"' && value[value.length - 1] === '"')
      value = value.substring(1, value.length - 1);

    // Clean up instances of just comma
    if(value.length === 1 && value === ',')
      value = '';
    return value;
  }

  const parseCSVToString = () => {
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
          objValues.push(value);
          valueStart = i + 1;
          quoteMatches = 0;

          if(data[i] === '\n' || i === data.length - 1) {
            if(i === data.length - 1)
              objValues.push(getValue(data, valueStart, i));
            values.push(objValues);
            objValues = [];
          }
        }
      }
    }
    return values;
  }


  const parseCSV = () => {
    const values = [];
    const headersProvided = config.headers != null;
    let headers = config.headers || [];
    let row = 0;
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

          if(config.headersInFirstLine && row == 0) {
            if(!headersProvided)
              headers.push(value);
          } else {
            objValues.push(value);
          }
          valueStart = i + 1;
          quoteMatches = 0;

          if(data[i] === '\n' || i === data.length - 1) {
            if(i === data.length - 1)
              objValues.push(getValue(data, valueStart, i));
            if(config.headersInFirstLine && row > 0)
              values.push(objValues);
            objValues = [];
            row++;
          }
        }
      }
    }
    return { values, headers };
  }

  const convertToJSON = (values, headers) => {
    const json = [];
    for(value of values) {
      const obj = {};
      for(let i=0; i<value.length; i++) {
        const k = headers[i];
        const v = value[i];
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
        console.log("Wrote to file");
    });
  }

  const data = openFile();
  const { values, headers } = parseCSV();
  const json = convertToJSON(values, headers);
  saveToFile(json);


  // console.log(headers);
  // console.log(values);
  console.log(json);
})();

//"headers": ["day", "title", "start", "end", "speaker", "image", "description", "executive", "resources"],
