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


const invoice1 = facturator.invoice({
  type: '03',
  series: 'B001',
  number: '00000010',
  issueDate: new Date(),
  currency: 'PEN',

  customer: {
    documentType: 'DNI',
    documentNumber: '00000000',
    name: 'CLIENTE PRUEBA 1',
  },

  items: [
    {
      description: 'Pollo a la brasa',
      quantity: 1,
      unitPrice: 35,
    },
  ],
});


const invoice2 = facturator.invoice({
  type: '03',
  series: 'B001',
  number: '00000011',
  issueDate: new Date(),
  currency: 'PEN',

  customer: {
    documentType: 'DNI',
    documentNumber: '00000000',
    name: 'CLIENTE PRUEBA 2',
  },

  items: [
    {
      description: 'Inca Kola',
      quantity: 2,
      unitPrice: 5,
    },
  ],
});


console.log('FACTURA 1:', invoice1.total);
console.log('FACTURA 2:', invoice2.total);


const result =
  await facturator.sendPack([
    invoice1,
    invoice2,
  ]);


console.log(
  'RESULTADO SUNAT:',
  result,
);