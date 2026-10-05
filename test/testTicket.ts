import { Facturator } from '../src/index.js';

import 'dotenv/config';

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

try {
  const status = await facturator.getStatus(
    '1791228503184',
  );

  console.log('STATUS OK');
  console.dir(status, { depth: 5 });

  if (status.status.statusCode === '0') {
  console.log('\n--- PROCESANDO CDR ---');

  const cdr = await facturator.processCdr(
    status.status.content,
  );

  console.log('\n--- CDR ---');
  console.dir(cdr, { depth: null });
}

} catch (error: any) {
  console.log('\n========== GET STATUS ERROR ==========');

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

  console.log('======================================\n');
}