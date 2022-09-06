// import * as parquet from 'parquetjs';
var parquet = require('parquetjs-lite');

export async function readParquetFile(fileName: string) {
  let reader = await parquet.ParquetReader.openFile(fileName);
  let cursor = reader.getCursor();

  let record = null;
  while ((record = await cursor.next())) {
    console.log(record);
  }
}
