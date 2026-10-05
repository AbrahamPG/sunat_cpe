import { readFileSync } from 'node:fs';
import { SignedXml } from 'xml-crypto';
import { DOMParser } from '@xmldom/xmldom';
import * as xpath from 'xpath';

export interface SignerConfig {
  privateKeyPath: string;
  certificatePath: string;
}

export interface SignOptions {
  locationXPath?: string;
}

export class XmlSigner {
  constructor(
    private readonly config: SignerConfig,
  ) {}

  sign(
    xml: string,
    options: SignOptions = {},
  ): string {

    const privateKey =
      readFileSync(
        this.config.privateKeyPath,
        'utf8',
      );

    const certificate =
      readFileSync(
        this.config.certificatePath,
        'utf8',
      );

    const signer =
      new SignedXml({
        privateKey,
        publicCert: certificate,

        signatureAlgorithm:
          'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256',

        canonicalizationAlgorithm:
          'http://www.w3.org/2001/10/xml-exc-c14n#',
      });


    signer.addReference({
      xpath: '/*',

      transforms: [
        'http://www.w3.org/2000/09/xmldsig#enveloped-signature',

        'http://www.w3.org/2001/10/xml-exc-c14n#',
      ],

      digestAlgorithm:
        'http://www.w3.org/2001/04/xmlenc#sha256',

      isEmptyUri: true,
    });


    signer.computeSignature(
      xml,
      {
        location: {
          reference:
            options.locationXPath ??
            "//*[local-name()='SignatureInformation']",

          action: 'append',
        },
      },
    );


    return signer.getSignedXml();
  }


  verify(
    xml: string,
  ): boolean {

    const document =
      new DOMParser().parseFromString(
        xml,
        'text/xml',
      );


    const signature =
      xpath.select1(
        "//*[local-name(.)='Signature' and namespace-uri(.)='http://www.w3.org/2000/09/xmldsig#']",
        document as any,
      );


    if (!signature) {
      throw new Error(
        'Signature not found',
      );
    }


    const certificate =
      readFileSync(
        this.config.certificatePath,
        'utf8',
      );


    const signer =
      new SignedXml({
        publicCert: certificate,
      });


    signer.loadSignature(
      signature as any,
    );


    return signer.checkSignature(
      xml,
    );
  }
}