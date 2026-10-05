import 'dotenv/config';
import { Facturator } from '../src/index.js';

const facturator = new Facturator({
  ruc: process.env.SUNAT_RUC!,
  legalName: process.env.SUNAT_LEGAL_NAME!,

  signer: {
    privateKeyPath: './certs/private-key.pem',
    certificatePath: './certs/certificate.pem',
  },


  sunat: {
    environment: 'beta',
    username: process.env.SUNAT_USER!,
    password: process.env.SUNAT_PASSWORD!,
  },
});

const invoice = facturator.invoice({
  type: '03',
  series: 'B001',
  number: '00000003',
  issueDate: new Date(),
  currency: 'PEN',

  customer: {
    documentType: 'DNI',
    documentNumber: '00000000',
    name: 'CLIENTE PRUEBA',
  },

  items: [
    {
      description: 'Pollo a la brasa',
      quantity: 1,
      unitPrice: 35,
    },
    {
      description: 'Inca Kola',
      quantity: 1,
      unitPrice: 5,
    },
  ],
});

console.log('TOTAL:', invoice.total);
console.log('SUBTOTAL:', invoice.subtotal);
console.log('IGV:', invoice.tax);

await invoice.sign();

console.log(
  'FIRMA:',
  invoice.verifySignature(),
);

const validation = await invoice.validate();

console.log(
  'XSD:',
  validation,
);

const result =
  await facturator.send(invoice);

console.log(
  'RESULTADO SUNAT:',
  result,
);


