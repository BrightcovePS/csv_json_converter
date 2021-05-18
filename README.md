# CSVConverter

A utility for converting CSV files into JSON

## Instructions

* Create the file `config.json` to specify CSV and JSON parameters
* Execute `npm run convert`
* You can optionally run `npm run convert --c=path/to/config.json`


### Parameters

| Parameter | Type | Description | Required |
--|--|--|--|
| inputFile | string | Points to the input CSV file. File path should be relative to project directory | yes |
| outputFile | string | The resulting JSON file to be generated after processing. File path should be relative to the project directory | yes |
| alignment | "H"/"V" | Specifies which axis the CSV contents should be read along. For data where cells of the same "type" are vertically listed, this should be "v" | yes |
| delimeter | char | The character separating data fields. Will most likely just be a "," | yes |
| headersInFirstLine | boolean | Specifies whether to consider the first line (along the specified alignment headers or data. **If *headers* has a value, this is ignored.** These are assessed **after** ignored rows/columns | no |
| headers | array | A user specified list of headers to use. This should match the number of items in a line based on the *alignment* and on any ignored rows/columns. This is an array of strings that will be used as JSON keys | no
| trim | boolean | Specify whether to automatically remove extra empty resultant JSON objects | no |
| skipRows | number | Specifies a number of rows to ignore from the left. **These are applied after determining the alignment** | no |
| skipColumns | number | Specifies a number of columns to ignore from the left. **These are applied after determining the alignment** | no |


### Type Conversion

It's possible to provide information on what types values should be converted to in the final JSON, by passing in an `object` instead of a `string` in the `headers` parameter. The parameter is able to take a combination of `string` and `object` in case no type conversion is needed for a particular header.

An example of a header with type information specified:

    {
        "name": <header/key name>,
        "type": <"string" | "number" | "array">,
        "delimiter": <character to split array values, if type is array>
    }

