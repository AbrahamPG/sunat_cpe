import unzipper from 'unzipper';

export interface CdrResult {
  accepted: boolean;
  responseCode: string;
  description: string;
}

export class CdrParser {
  async parse(
    applicationResponse: string,
  ): Promise<CdrResult> {
    const zipBuffer =
      Buffer.from(
        applicationResponse,
        'base64',
      );

    const directory =
      await unzipper.Open.buffer(
        zipBuffer,
      );

    const xmlFile =
      directory.files.find(
        file =>
          file.path.endsWith('.xml'),
      );

    if (!xmlFile) {
      throw new Error(
        'No se encontró XML dentro del CDR',
      );
    }

    const xmlBuffer =
      await xmlFile.buffer();

    const xml =
      xmlBuffer.toString('utf8');

    const responseCode =
      xml.match(
        /<cbc:ResponseCode[^>]*>(.*?)<\/cbc:ResponseCode>/,
      )?.[1];

    const description =
      xml.match(
        /<cbc:Description[^>]*>(.*?)<\/cbc:Description>/,
      )?.[1];

    if (!responseCode) {
      throw new Error(
        'No se encontró ResponseCode en el CDR',
      );
    }

    if (!description) {
      throw new Error(
        'No se encontró Description en el CDR',
      );
    }

    return {
      accepted:
        responseCode === '0',

      responseCode,

      description,
    };
  }
}