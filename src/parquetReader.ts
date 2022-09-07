var parquet = require('parquetjs-lite');

export interface ParquetData {
  columnNames: string[];
  rows: any[];
}

export async function readParquetFile(fileName: string): Promise<ParquetData> {
  let reader = await parquet.ParquetReader.openFile(fileName);

  const columnNames = reader.schema.fieldList.map((r: any) => r.name);

  let cursor = reader.getCursor();
  const rows = [];

  let record = null;
  while ((record = await cursor.next())) {
    rows.push(record);
  }
  return {
    columnNames,
    rows
  };
}
