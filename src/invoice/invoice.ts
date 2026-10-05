import { XmlBuilder } from '../xml/xml-builder.js';
import { XmlSigner } from '../signature/signer.js';
import type { XsdValidator } from '../validation/xsd-validator.js';




export interface InvoiceCustomer {
  documentType: string;
  documentNumber: string;
  name: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoiceData {
  type: string;
  series: string;
  number: string;
  issueDate: Date;
  currency: string;

  customer: InvoiceCustomer;

  items: InvoiceItem[];
}

export class Invoice {
  private signedXml?: string;

  constructor(
    public readonly data: InvoiceData,
    private readonly xmlBuilder: XmlBuilder,
    private readonly xmlSigner: XmlSigner,
    private readonly xsdValidator: XsdValidator,
  ) {}

  get total(): number {
    return this.data.items.reduce(
      (total, item) =>
        total + item.quantity * item.unitPrice,
      0,
    );
  }

  get subtotal(): number {
    return this.total / 1.18;
  }

  get tax(): number {
    return this.total - this.subtotal;
  }

  get xml(): string {
    return this.xmlBuilder.build(this);
  }

  async sign(): Promise<string> {
  if (this.signedXml) {
    return this.signedXml;
  }

  const xml = this.xmlBuilder.build(this);

  this.signedXml =
    this.xmlSigner.sign(xml);

  return this.signedXml;
}

  verifySignature(): boolean {
    if (!this.signedXml) {
      throw new Error(
        'Invoice must be signed before verifying the signature',
      );
    }

    return this.xmlSigner.verify(
      this.signedXml,
    );
  }

  async validate(): Promise<boolean> {
  if (!this.signedXml) {
    throw new Error(
      'Invoice must be signed before validation',
    );
  }

  const result =
  await this.xsdValidator.validate(
    this.signedXml,
    'maindoc/UBL-Invoice-2.1.xsd',
  );

  return result.valid;
  }





}