import {
  Invoice,
  type InvoiceData,
} from './invoice/invoice.js';

import { XmlBuilder } from './xml/xml-builder.js';

import {
  XmlSigner,
  type SignerConfig,
} from './signature/signer.js';

import { XsdValidator } from './validation/xsd-validator.js';

import { ZipPackager } from './packaging/zip-packager.js';

import {
  SunatClient,
  type SunatConfig,
} from './sunat/sunat-client.js';

import { CdrParser } from './sunat/cdr-parser.js';

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { SummaryBuilder } from './xml/summary-builder.js';


const packageRoot = dirname(
  fileURLToPath(import.meta.url),
);


const defaultXsdRoot = join(
  packageRoot,
  '..',
  'xsd',
  '2.1',
);

const defaultSummaryXsdRoot = join(
  packageRoot,
  '..',
  'xsd',
  '2.0',
);


const defaultWsdlPath = join(
  packageRoot,
  '..',
  'wsdl',
  'billService.wsdl',
);


export interface FacturatorConfig {
  ruc: string;
  legalName: string;
  signer: SignerConfig;
  sunat: SunatConfig;
}


export class Facturator {
  private readonly xmlBuilder: XmlBuilder;
  private readonly xmlSigner: XmlSigner;
  private readonly xsdValidator: XsdValidator;
  private readonly zipPackager: ZipPackager;
  private readonly sunatClient: SunatClient;
  private readonly cdrParser: CdrParser;
  private readonly summaryBuilder: SummaryBuilder;
  private readonly summaryXsdValidator: XsdValidator;


  constructor(
    private readonly config: FacturatorConfig,
  ) {
    this.xmlBuilder =
      new XmlBuilder({
        ruc: config.ruc,
        legalName: config.legalName,
      });


    this.xmlSigner =
      new XmlSigner(
        config.signer,
      );


    this.xsdValidator =
      new XsdValidator(
        defaultXsdRoot,
      );


    this.zipPackager =
      new ZipPackager();


    this.sunatClient =
      new SunatClient(
        config.sunat,
        defaultWsdlPath,
      );


    this.cdrParser =
      new CdrParser();


    this.summaryBuilder =
      new SummaryBuilder({
        ruc: config.ruc,
        legalName: config.legalName,
      });

    this.summaryXsdValidator =
    new XsdValidator(
      defaultSummaryXsdRoot,
    );


  }


  invoice(data: InvoiceData) {
    return new Invoice(
      data,
      this.xmlBuilder,
      this.xmlSigner,
      this.xsdValidator,
    );
  }


  async packageInvoice(
    invoice: Invoice,
  ): Promise<Buffer> {

    const signedXml =
      await invoice.sign();


    const fileName =
      `${this.config.ruc}-${invoice.data.type}-${invoice.data.series}-${invoice.data.number}.xml`;


    return this.zipPackager.package(
      fileName,
      signedXml,
    );
  }


  async send(
    invoice: Invoice,
  ) {

    const zip =
      await this.packageInvoice(
        invoice,
      );


    const fileName =
      `${this.config.ruc}-${invoice.data.type}-${invoice.data.series}-${invoice.data.number}.zip`;


    const response =
      await this.sunatClient.sendBill(
        fileName,
        zip,
      );


    return this.cdrParser.parse(
      response.applicationResponse,
    );
  }

  // TODO: Verify sendPack against SUNAT.
// Current testing reaches SUNAT but the service returns
// Server.0130: "No se pudo obtener el ticket de proceso".
  async sendPack(
    invoices: Invoice[],
  ) {

    const files = [];


    for (const invoice of invoices) {

      const signedXml =
        await invoice.sign();


      const fileName =
        `${this.config.ruc}-${invoice.data.type}-${invoice.data.series}-${invoice.data.number}.xml`;


      files.push({
        fileName,
        content: signedXml,
      });
    }


    const zip =
      await this.zipPackager.packageMany(
        files,
      );


    const date =
      invoices[0].data.issueDate;


    const yyyy =
      date.getFullYear();


    const mm =
      String(
        date.getMonth() + 1,
      ).padStart(2, '0');


    const dd =
      String(
        date.getDate(),
      ).padStart(2, '0');


    const zipFileName =
      `${this.config.ruc}-LT-${yyyy}${mm}${dd}-1.zip`;


    return this.sunatClient.sendPack(
      zipFileName,
      zip,
    );
  }


  async sendSummary(
  invoices: Invoice[],
) {
  const xml =
    this.summaryBuilder.build(
      invoices,
    );

  const signedXml =
    this.xmlSigner.sign(
      xml,
      {
        locationXPath:
          "//*[local-name()='ExtensionContent']",
      },
    );

  const referenceDate =
    invoices[0].data.issueDate;

  const date =
    referenceDate
      .toISOString()
      .slice(0, 10)
      .replaceAll('-', '');

  const correlativo = 1;

const baseName =
  `${this.config.ruc}-RC-${date}-${correlativo}`;

  const zip =
    await this.zipPackager.package(
      `${baseName}.xml`,
      signedXml,
    );

  return this.sunatClient.sendSummary(
    `${baseName}.zip`,
    zip,
  );
}


  async getStatus(
    ticket: string,
  ) {

    return this.sunatClient.getStatus(
      ticket,
    );
  }

  processCdr(
  content: string,
) {
  return this.cdrParser.parse(
    content,
  );
}


  buildSummary(
    invoices: Invoice[],
  ) {

    return this.summaryBuilder.build(
      invoices,
    );
  }


  async sendMany(
    invoices: Invoice[],
  ) {

    const results = [];


    for (const invoice of invoices) {

      try {

        const result =
          await this.send(
            invoice,
          );


        results.push({
          invoice: {
            series:
              invoice.data.series,

            number:
              invoice.data.number,
          },

          success: true,

          result,
        });

      } catch (error) {

        const errorObject =
          error as any;


        results.push({
          invoice: {
            series:
              invoice.data.series,

            number:
              invoice.data.number,
          },

          success: false,

          error: {
            status:
              errorObject?.response?.status,

            body:
              errorObject?.response?.body,
          },
        });
      }
    }


    return results;
  }

  async signSummary(
  invoices: Invoice[],
) {
  const xml =
    this.summaryBuilder.build(
      invoices,
    );

  return this.xmlSigner.sign(
    xml,
    {
      locationXPath:
        "//*[local-name()='ExtensionContent']",
    },
  );
}


async signAndVerifySummary(
  invoices: Invoice[],
) {
  const xml =
    this.summaryBuilder.build(
      invoices,
    );

  const signedXml =
    this.xmlSigner.sign(
      xml,
      {
        locationXPath:
          "//*[local-name()='ExtensionContent']",
      },
    );

  const valid =
    this.xmlSigner.verify(
      signedXml,
    );

  return {
    valid,
    signedXml,
  };
}


async validateSummary(
  invoices: Invoice[],
) {
  const xml =
    this.summaryBuilder.build(
      invoices,
    );

  const signedXml =
    this.xmlSigner.sign(
      xml,
      {
        locationXPath:
          "//*[local-name()='ExtensionContent']",
      },
    );

  const signatureValid =
    this.xmlSigner.verify(
      signedXml,
    );

  const xsdResult =
    await this.summaryXsdValidator.validate(
      signedXml,
      'maindoc/UBLPE-SummaryDocuments-1.0.xsd',
    );

  return {
    signatureValid,
    xsd: xsdResult,
  };
}

async inspectSunat() {
  return this.sunatClient.inspect();
}


}