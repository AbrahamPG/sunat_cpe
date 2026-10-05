import { create } from 'xmlbuilder2';

import { Invoice } from '../invoice/invoice.js';

export interface XmlBuilderConfig{
    ruc: string;
    legalName: string;
}


export class XmlBuilder {

    constructor (
        private readonly config: XmlBuilderConfig
    ){}



  build(invoice: Invoice): string {


    const root = create(
      {
        version: '1.0',
        encoding: 'UTF-8',
      },
    ).ele('Invoice', {

      xmlns:
        'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',

      'xmlns:cac':
        'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',

      'xmlns:cbc':
        'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',

      'xmlns:ext':
        'urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2',

      'xmlns:sig':
        'urn:oasis:names:specification:ubl:schema:xsd:CommonSignatureComponents-2',

      'xmlns:sac':
        'urn:oasis:names:specification:ubl:schema:xsd:SignatureAggregateComponents-2',

      'xmlns:sbc':
        'urn:oasis:names:specification:ubl:schema:xsd:SignatureBasicComponents-2',

      'xmlns:ds':
        'http://www.w3.org/2000/09/xmldsig#',
    });

    // ─────────────────────────────
    // Firma UBL
    // ─────────────────────────────

    const extensions =
      root.ele('ext:UBLExtensions');

    const extension =
      extensions.ele('ext:UBLExtension');

    extension
      .ele('ext:ExtensionURI')
      .txt('urn:oasis:names:specification:ubl:dsig:enveloped');

    const extensionContent =
      extension.ele('ext:ExtensionContent');

    const documentSignatures =
      extensionContent.ele(
        'sig:UBLDocumentSignatures',
      );

    const signatureInformation =
      documentSignatures.ele(
        'sac:SignatureInformation',
      );

    signatureInformation
      .ele('cbc:ID')
      .txt('urn:oasis:names:specification:ubl:signature:1');

    signatureInformation
      .ele('sbc:ReferencedSignatureID')
      .txt(
        'urn:oasis:names:specification:ubl:signature:Invoice',
      );

    // ─────────────────────────────
    // Información general
    // ─────────────────────────────

    root
      .ele('cbc:UBLVersionID')
      .txt('2.1');

    root
      .ele('cbc:CustomizationID')
      .txt('2.0');

    root
      .ele('cbc:ProfileID', {
        schemeName:
          'SUNAT:Identificador de Tipo de Operación',

        schemeAgencyName:
          'PE:SUNAT',

        schemeURI:
          'urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo51',
      })
      .txt('0101');

    root
      .ele('cbc:ID')
      .txt(
        `${invoice.data.series}-${invoice.data.number}`,
      );

    root
      .ele('cbc:IssueDate')
      .txt(
        invoice.data.issueDate
          .toISOString()
          .split('T')[0],
      );

    root
      .ele('cbc:InvoiceTypeCode', {

        listID: '0101',

        listAgencyName:
          'PE:SUNAT',

        listName:
          'Tipo de Documento',

        listURI:
          'urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo01',

        listSchemeURI:
          'urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo51',

        name:
          'Tipo de Operacion',
      })
      .txt('03');

    root
      .ele('cbc:DocumentCurrencyCode', {

        listID:
          'ISO 4217 Alpha',

        listName:
          'Currency',

        listAgencyName:
          'United Nations Economic Commission for Europe',

      })
      .txt(invoice.data.currency);

    // ─────────────────────────────
    // Emisor
    // ─────────────────────────────

    const supplier =
      root.ele('cac:AccountingSupplierParty');

    const supplierParty =
      supplier.ele('cac:Party');

    supplierParty
      .ele('cac:PartyIdentification')
      .ele('cbc:ID', {
        schemeID: '6',
      })
      .txt(this.config.ruc);

    supplierParty
      .ele('cac:PartyName')
      .ele('cbc:Name')
      .txt(this.config.legalName);

    const supplierTaxScheme =
      supplierParty.ele(
        'cac:PartyTaxScheme',
      );

    supplierTaxScheme
      .ele('cbc:CompanyID', {
        schemeID: '6',
      })
      .txt(this.config.ruc);

    const supplierTax =
      supplierTaxScheme.ele(
        'cac:TaxScheme',
      );

    supplierTax
      .ele('cbc:ID')
      .txt('1000');

    supplierTax
      .ele('cbc:Name')
      .txt('IGV');

    supplierTax
      .ele('cbc:TaxTypeCode')
      .txt('VAT');

    const supplierLegalEntity =
      supplierParty.ele(
        'cac:PartyLegalEntity',
      );

    supplierLegalEntity
      .ele('cbc:RegistrationName')
      .txt(this.config.legalName);

    // ─────────────────────────────
    // Cliente
    // ─────────────────────────────

    const customer =
      invoice.data.customer;

    const customerElement =
      root.ele(
        'cac:AccountingCustomerParty',
      );

    const customerParty =
      customerElement.ele('cac:Party');

    customerParty
      .ele('cac:PartyIdentification')
      .ele('cbc:ID', {
        schemeID:
          customer.documentType === 'DNI'
            ? '1'
            : '6',
      })
      .txt(
        customer.documentNumber,
      );

    customerParty
      .ele('cac:PartyName')
      .ele('cbc:Name')
      .txt(customer.name);

    const customerLegalEntity =
      customerParty.ele(
        'cac:PartyLegalEntity',
      );

    customerLegalEntity
      .ele('cbc:RegistrationName')
      .txt(customer.name);

    // ─────────────────────────────
    // Impuestos generales
    // ─────────────────────────────

    const taxTotal =
      root.ele('cac:TaxTotal');

    taxTotal
      .ele('cbc:TaxAmount', {
        currencyID:
          invoice.data.currency,
      })
      .txt(
        invoice.tax.toFixed(2),
      );

    const taxSubtotal =
      taxTotal.ele('cac:TaxSubtotal');

    taxSubtotal
      .ele('cbc:TaxableAmount', {
        currencyID:
          invoice.data.currency,
      })
      .txt(
        invoice.subtotal.toFixed(2),
      );

    taxSubtotal
      .ele('cbc:TaxAmount', {
        currencyID:
          invoice.data.currency,
      })
      .txt(
        invoice.tax.toFixed(2),
      );

    const taxCategory =
      taxSubtotal.ele(
        'cac:TaxCategory',
      );

    taxCategory
      .ele('cbc:ID', {

        schemeID:
          'UN/ECE 5305',

        schemeName:
          'Tax Category Identifier',

        schemeAgencyName:
          'United Nations Economic Commission for Europe',

      })
      .txt('S');

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

    // ─────────────────────────────
    // Totales
    // ─────────────────────────────

    const totals =
      root.ele(
        'cac:LegalMonetaryTotal',
      );

    totals
      .ele('cbc:TaxExclusiveAmount', {
        currencyID:
          invoice.data.currency,
      })
      .txt(
        invoice.subtotal.toFixed(2),
      );

    totals
      .ele('cbc:PayableAmount', {
        currencyID:
          invoice.data.currency,
      })
      .txt(
        invoice.total.toFixed(2),
      );

    // ─────────────────────────────
    // Items
    // ─────────────────────────────

    for (
      let index = 0;
      index < invoice.data.items.length;
      index++
    ) {

      const item =
        invoice.data.items[index];

      const line =
        root.ele('cac:InvoiceLine');

      line
        .ele('cbc:ID')
        .txt(
          String(index + 1),
        );

      line
        .ele('cbc:InvoicedQuantity', {
          unitCode: 'NIU',
        })
        .txt(
          String(item.quantity),
        );

      const lineTotal =
        item.quantity *
        item.unitPrice;

      line
        .ele('cbc:LineExtensionAmount', {
          currencyID:
            invoice.data.currency,
        })
        .txt(
          lineTotal.toFixed(2),
        );

      // ─────────────────────────
      // Precio
      // ─────────────────────────

      const pricingReference =
        line.ele(
          'cac:PricingReference',
        );

      const alternativeConditionPrice =
        pricingReference.ele(
          'cac:AlternativeConditionPrice',
        );

      alternativeConditionPrice
        .ele('cbc:PriceAmount', {
          currencyID:
            invoice.data.currency,
        })
        .txt(
          item.unitPrice.toFixed(2),
        );

      alternativeConditionPrice
        .ele('cbc:PriceTypeCode', {

          listName:
            'SUNAT:Indicador de Tipo de Precio',

          listAgencyName:
            'PE:SUNAT',

          listURI:
            'urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo16',

        })
        .txt('01');

      // ─────────────────────────
      // Impuesto de línea
      // ─────────────────────────

      const lineSubtotal =
        lineTotal / 1.18;

      const lineTax =
        lineTotal - lineSubtotal;

      const lineTaxTotal =
        line.ele('cac:TaxTotal');

      lineTaxTotal
        .ele('cbc:TaxAmount', {
          currencyID:
            invoice.data.currency,
        })
        .txt(
          lineTax.toFixed(2),
        );

      const lineTaxSubtotal =
        lineTaxTotal.ele(
          'cac:TaxSubtotal',
        );

      lineTaxSubtotal
        .ele('cbc:TaxableAmount', {
          currencyID:
            invoice.data.currency,
        })
        .txt(
          lineSubtotal.toFixed(2),
        );

      lineTaxSubtotal
        .ele('cbc:TaxAmount', {
          currencyID:
            invoice.data.currency,
        })
        .txt(
          lineTax.toFixed(2),
        );

      const lineTaxCategory =
        lineTaxSubtotal.ele(
          'cac:TaxCategory',
        );

      lineTaxCategory
        .ele('cbc:ID', {

          schemeID:
            'UN/ECE 5305',

          schemeName:
            'Tax Category Identifier',

          schemeAgencyName:
            'United Nations Economic Commission for Europe',

        })
        .txt('S');

      lineTaxCategory
        .ele('cbc:Percent')
        .txt('18.00');

      lineTaxCategory
        .ele(
          'cbc:TaxExemptionReasonCode',
          {
            listAgencyName:
              'PE:SUNAT',

            listName:
              'SUNAT:Codigo de Tipo de Afectación del IGV',

            listURI:
              'urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo07',
          },
        )
        .txt('10');

      const lineTaxScheme =
        lineTaxCategory.ele(
          'cac:TaxScheme',
        );

      lineTaxScheme
        .ele('cbc:ID')
        .txt('1000');

      lineTaxScheme
        .ele('cbc:Name')
        .txt('IGV');

      lineTaxScheme
        .ele('cbc:TaxTypeCode')
        .txt('VAT');

      // ─────────────────────────
      // Producto
      // ─────────────────────────

      line
        .ele('cac:Item')
        .ele('cbc:Description')
        .txt(
          item.description,
        );

      // ─────────────────────────
      // Precio
      // ─────────────────────────

      line
        .ele('cac:Price')
        .ele('cbc:PriceAmount', {
          currencyID:
            invoice.data.currency,
        })
        .txt(
          item.unitPrice.toFixed(2),
        );
    }

    return root.end({
      prettyPrint: true,
    });
  }
}