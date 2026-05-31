import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class CsvImportService {
  async parseCsv<T>(file: Express.Multer.File): Promise<T[]> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    if (!file.mimetype.includes('csv') && !file.originalname.endsWith('.csv')) {
      throw new BadRequestException('Only CSV files are accepted');
    }
    const csv = require('csv-parser');
    const results: T[] = [];
    return new Promise((resolve, reject) => {
      const stream = require('stream');
      const bufferStream = new stream.PassThrough();
      bufferStream.end(file.buffer);
      bufferStream
        .pipe(csv())
        .on('data', (data: T) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', reject);
    });
  }
}
