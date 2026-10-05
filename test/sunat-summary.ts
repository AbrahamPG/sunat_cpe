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

// ─────────────────────────────────────
// BOLETA 1
// ─────────────────────────────────────

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

// ─────────────────────────────────────
// BOLETA 2
// ─────────────────────────────────────

const invoice2 = facturator.invoice({
  type: '03',
  series: 'B001',
  number: '00000011',

  // Misma fecha para el mismo resumen
  issueDate: invoice1.data.issueDate,

  currency: 'PEN',

  customer: {
    documentType: 'DNI',
    documentNumber: '00000000',
    name: 'CLIENTE PRUEBA 2',
  },

  items: [
    {
      description: 'Pollo a la brasa',
      quantity: 1,
      unitPrice: 40,
    },
  ],
});

// ─────────────────────────────────────
// SUMMARY XML
// ─────────────────────────────────────

console.log('\n--- SUMMARY XML ---\n');

const summaryXml =
  facturator.buildSummary([
    invoice1,
    invoice2,
  ]);

console.log(summaryXml);

// ─────────────────────────────────────
// FIRMA
// ─────────────────────────────────────

const signedSummary =
  await facturator.signSummary([
    invoice1,
    invoice2,
  ]);

console.log(
  '\n--- SIGNED SUMMARY XML ---\n',
);

console.log(signedSummary);

// ─────────────────────────────────────
// VERIFICAR FIRMA
// ─────────────────────────────────────

const result =
  await facturator.signAndVerifySummary([
    invoice1,
    invoice2,
  ]);

console.log(
  '\n--- SIGNATURE VALID ---\n',
);

console.log(result.valid);

// ─────────────────────────────────────
// VALIDAR XSD
// ─────────────────────────────────────

const validation =
  await facturator.validateSummary([
    invoice1,
    invoice2,
  ]);

console.log(
  '\n--- SIGNED SUMMARY VALIDATION ---\n',
);

console.dir(
  validation,
  {
    depth: null,
  },
);

// ─────────────────────────────────────
// SUNAT WSDL
// ─────────────────────────────────────

console.log(
  '\n--- SUNAT WSDL ---\n',
);

await facturator.inspectSunat();

// ─────────────────────────────────────
// ENVIAR A SUNAT
// ─────────────────────────────────────

try {
  const response = await facturator.sendSummary([
  invoice1,
  invoice2,
]);

console.log('\n[TICKET]');
console.log(response.ticket);

// Esperamos a que SUNAT procese el ticket
await new Promise(resolve =>
  setTimeout(resolve, 2000),
);

const status =
  await facturator.getStatus(response.ticket);

console.log('\n[SUNAT STATUS]');
console.dir(status, { depth: null });

if (status.status.statusCode === '0') {
  const cdr =
    await facturator.processCdr(
      status.status.content,
    );

  console.log('\n[CDR]');
  console.dir(cdr, { depth: null });
}

} catch (error: any) {

  console.log(
    '\n========== SUNAT ERROR ==========\n',
  );

  console.log(
    'faultcode:',
    error?.Fault?.faultcode,
  );

  console.log(
    'faultstring:',
    error?.Fault?.faultstring,
  );

  console.log(
    'detail:',
    error?.Fault?.detail,
  );

  console.log(
    'http status:',
    error?.response?.status,
  );

  console.log(
    'http statusText:',
    error?.response?.statusText,
  );

  console.log(
    'SOAPAction:',
    error?.response?.config?.headers?.SOAPAction,
  );

  console.log(
    '=================================\n',
  );
}