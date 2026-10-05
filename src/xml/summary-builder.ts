import { create } from 'xmlbuilder2';
import type { Invoice } from '../invoice/invoice.js';

export interface SummaryBuilderConfig {
  ruc: string;
  legalName: string;
}

export class SummaryBuilder {
  constructor(
    private readonly config: SummaryBuilderConfig,
  ) {}

  build(
    invoices: Invoice[],
  ): string {
    if (invoices.length === 0) {
      throw new Error(
        'El resumen debe contener al menos una boleta',
      );
    }

    const firstDate =
      invoices[0].data.issueDate;

    const referenceDate =
      this.formatDate(firstDate);

    for (const invoice of invoices) {
      const invoiceDate =
        this.formatDate(
          invoice.data.issueDate,
        );

      if (invoiceDate !== referenceDate) {
        throw new Error(
          'Todas las boletas del resumen deben tener la misma fecha de emisión',
        );
      }

      if (invoice.data.type !== '03') {
        throw new Error(
          'El resumen solo admite boletas',
        );
      }
    }

    const root = create({
      version: '1.0',
      encoding: 'UTF-8',
    }).ele('SummaryDocuments', {
      xmlns:
        'urn:sunat:names:specification:ubl:peru:schema:xsd:SummaryDocuments-1',
      'xmlns:cac':
        'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
      'xmlns:cbc':
        'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
      'xmlns:ext':
        'urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2',
      'xmlns:sac':
        'urn:sunat:names:specification:ubl:peru:schema:xsd:SunatAggregateComponents-1',
      'xmlns:ds':
        'http://www.w3.org/2000/09/xmldsig#',
    });

    root
      .ele('ext:UBLExtensions')
      .ele('ext:UBLExtension')
      .ele('ext:ExtensionContent');

    root
      .ele('cbc:UBLVersionID')
      .txt('2.0');

    root
      .ele('cbc:CustomizationID')
      .txt('1.1');

    const correlativo = 1;

const summaryId =
  `RC-${referenceDate.replaceAll('-', '')}-${correlativo}`;

    root
  .ele('cbc:ID')
  .txt(summaryId);

root
  .ele('cbc:ReferenceDate')
  .txt(referenceDate);

root
  .ele('cbc:IssueDate')
  .txt(
    this.formatDate(
      new Date(),
    ),
  );

    // ─────────────────────────────────────
    // FIRMA DEL DOCUMENTO
    // ─────────────────────────────────────

    const signature =
      root.ele('cac:Signature');

    signature
      .ele('cbc:ID')
      .txt('IDSignKG');

    const signatoryParty =
      signature.ele(
        'cac:SignatoryParty',
      );

    signatoryParty
      .ele('cac:PartyIdentification')
      .ele('cbc:ID')
      .txt(this.config.ruc);

    signatoryParty
      .ele('cac:PartyName')
      .ele('cbc:Name')
      .txt(this.config.legalName);

    signature
      .ele(
        'cac:DigitalSignatureAttachment',
      )
      .ele('cac:ExternalReference')
      .ele('cbc:URI')
      .txt('#IDSignKG');

    // ─────────────────────────────────────
    // EMISOR
    // ─────────────────────────────────────

    const supplier =
      root.ele(
        'cac:AccountingSupplierParty',
      );

    supplier
      .ele('cbc:CustomerAssignedAccountID')
      .txt(this.config.ruc);

    supplier
      .ele('cbc:AdditionalAccountID')
      .txt('6');

    const supplierParty =
      supplier.ele('cac:Party');

    supplierParty
      .ele('cac:PartyLegalEntity')
      .ele('cbc:RegistrationName')
      .txt(this.config.legalName);

    // ─────────────────────────────────────
    // BOLETAS
    // ─────────────────────────────────────

    invoices.forEach(
      (invoice, index) => {
        this.addLine(
          root,
          invoice,
          index + 1,
        );
      },
    );

    return root.end({
      prettyPrint: true,
    });
  }

  private addLine(
    root: any,
    invoice: Invoice,
    lineNumber: number,
  ) {
    const line =
      root.ele(
        'sac:SummaryDocumentsLine',
      );

    line
      .ele('cbc:LineID')
      .txt(String(lineNumber));

    line
      .ele('cbc:DocumentTypeCode')
      .txt(invoice.data.type);

    line
      .ele('cbc:ID')
      .txt(
        `${invoice.data.series}-${invoice.data.number}`,
      );

    // ─────────────────────────────────────
    // CLIENTE
    // ─────────────────────────────────────

    const customer =
      line.ele(
        'cac:AccountingCustomerParty',
      );

    customer
      .ele('cbc:CustomerAssignedAccountID')
      .txt(
        invoice.data.customer.documentNumber,
      );

    customer
      .ele('cbc:AdditionalAccountID')
      .txt(
        this.getDocumentTypeCode(
          invoice.data.customer.documentType,
        ),
      );

    // ─────────────────────────────────────
    // ESTADO
    // ─────────────────────────────────────

    line
      .ele('cac:Status')
      .ele('cbc:ConditionCode')
      .txt('1');

    // ─────────────────────────────────────
    // TOTAL
    // ─────────────────────────────────────

    line
      .ele('sac:TotalAmount', {
        currencyID: 'PEN',
      })
      .txt(
        invoice.total.toFixed(2),
      );

    // ─────────────────────────────────────
    // VALOR DE VENTA
    // ─────────────────────────────────────

    const billingPayment =
      line.ele(
        'sac:BillingPayment',
      );

    billingPayment
      .ele('cbc:PaidAmount', {
        currencyID: 'PEN',
      })
      .txt(
        invoice.subtotal.toFixed(2),
      );

    billingPayment
      .ele('cbc:InstructionID')
      .txt('01');

    // ─────────────────────────────────────
    // IGV
    // ─────────────────────────────────────

    const taxTotal =
      line.ele('cac:TaxTotal');

    taxTotal
      .ele('cbc:TaxAmount', {
        currencyID: 'PEN',
      })
      .txt(
        invoice.tax.toFixed(2),
      );

    const taxSubtotal =
      taxTotal.ele(
        'cac:TaxSubtotal',
      );

    taxSubtotal
      .ele('cbc:TaxAmount', {
        currencyID: 'PEN',
      })
      .txt(
        invoice.tax.toFixed(2),
      );

    const taxCategory =
      taxSubtotal.ele(
        'cac:TaxCategory',
      );

    const taxScheme =
      taxCategory.ele(
        'cac:TaxScheme',
      );

    taxScheme
      .ele('cbc:ID')
      .txt('1000');

    taxScheme
      .ele('cbc:Name')
      .txt('IGV');

    taxScheme
      .ele('cbc:TaxTypeCode')
      .txt('VAT');
  }

  private getDocumentTypeCode(
    documentType: string,
  ): string {
    if (documentType === 'DNI') {
      return '1';
    }

    if (documentType === 'RUC') {
      return '6';
    }

    throw new Error(
      `Tipo de documento no soportado: ${documentType}`,
    );
  }

  private formatDate(
    date: Date,
  ): string {
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

    return `${yyyy}-${mm}-${dd}`;
  }
}