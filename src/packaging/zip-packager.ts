import { createRequire } from 'node:module';
import { PassThrough } from 'node:stream';

const require = createRequire(import.meta.url);
const archiver = require('archiver');

export interface ZipFile {
  fileName: string;
  content: string;
}

export class ZipPackager {
  async package(
    fileName: string,
    signedXml: string,
  ): Promise<Buffer> {
    return this.packageMany([
      {
        fileName,
        content: signedXml,
      },
    ]);
  }

  async packageMany(
    files: ZipFile[],
  ): Promise<Buffer> {
    const archive = archiver('zip');
    const output = new PassThrough();
    const chunks: Buffer[] = [];

    output.on('data', (chunk) => {
      chunks.push(chunk);
    });

    archive.pipe(output);

    for (const file of files) {
      archive.append(file.content, {
        name: file.fileName,
      });
    }

    await archive.finalize();

    return Buffer.concat(chunks);
  }
}