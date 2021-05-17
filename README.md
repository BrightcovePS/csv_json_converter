# CSVConverter

A utility for converting CSV files into JSON


## Instructions

* Create the file `config.json` to specify CSV and JSON parameters
* Execute `npm run convert`
* You can optionally run `npm run convert -c path/to/config`


### Parameters

| Parameter  | Type | Description | Required |
--|--|--|--|
| inputFile | string | Points to the input CSV file. File path should be relative to project directory |  yes |
| outputFile | string | The resulting JSON file to be generated after processing. File path should be relative to the project directory | yes |
| alignment | "H"/"V" | Specifies which axis the CSV contents should be read along. For data specified along rows this should be "V" | yes |
| delimeter | char | The character separating data fields. Will most likely just be a "," | yes |
| headersInFirstLine | boolean | Specifies whether to consider the first line (along the specified alignment headers or data. **If *headers* has a value, this is ignored.** These are assessed **after** ignored rows/columns | no |
| headers | array | A user specified list of headers to use. This should match the number of items in a line based on the *alignment* and on any ignored rows/columns | no
| trim | boolean | Specify whether to automatically remove extra empty resultant JSON objects | no |
| skipRows | number | Specifies a number of rows to ignore from the left. **These are applied after determining the alignment** | no |
| skipColumns | number | Specifies a number of columns to ignore from the left. **These are applied after determining the alignment** | no |