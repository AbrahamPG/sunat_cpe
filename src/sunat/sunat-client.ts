import * as soap from 'soap';

export interface SunatConfig {
  username: string;
  password: string;
  environment: 'beta' | 'production'
}

const SUNAT_ENDPOINTS = {
    beta:
      'https://e-beta.sunat.gob.pe:443/ol-ti-itcpfegem-beta/billService',

    production:
      'https://e-factura.sunat.gob.pe:443/ol-ti-itcpfegem/billService',
    };  

    
export class SunatClient {
  constructor(
    private readonly config: SunatConfig,
    private readonly wsdlPath: string,
  ) {}


  private async createClient() {
    const client =
      await soap.createClientAsync(
        this.wsdlPath,
      );
      

      client.setEndpoint(
      SUNAT_ENDPOINTS[
        this.config.environment
      ],
      );
      client.on('request', (xml) => {
      console.log('--- SOAP REQUEST ---');
      console.log(xml);
      });

    const security =
      new soap.WSSecurity(
        this.config.username,
        this.config.password,
        {
          passwordType: 'PasswordText',
        },
      );

    client.setSecurity(security);

    

    return client;
  }

  async sendBill(
    fileName: string,
    zip: Buffer,
  ) {
    const client =
      await this.createClient();

    const [response] =
      await client.sendBillAsync({
        fileName,
        contentFile:
          zip.toString('base64'),
        partyType: '1',
      });

    return response;
  }

  async sendPack(
  fileName: string,
  zip: Buffer,
) {
  const client =
    await this.createClient();

  const [response] =
    await client.sendPackAsync({
      fileName,
      contentFile:
        zip.toString('base64'),
        partyType: '1'
    });

  return response;
}



async getStatus(
  ticket: string,
) {
  const client =
    await this.createClient();

  const [response] =
    await client.getStatusAsync({
      ticket,
    });

  return response;
}


async sendSummary(
  fileName: string,
  zip: Buffer,
) {
  const client =
    await this.createClient();

  const [response] =
    await client.sendSummaryAsync({
      fileName,
      contentFile:
        zip.toString('base64'),
      partyType: '1',
    });

  return response;
}



async inspect() {
  const client =
    await this.createClient();

  console.dir(
    client.describe(),
    {
      depth: null,
    },
  );
}





}