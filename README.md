# 🇵🇪 Facturator

**SDK en TypeScript para generar, firmar, validar y enviar comprobantes electrónicos a SUNAT.**

Facturator es un proyecto de aprendizaje y desarrollo continuo creado para explorar y comprender cómo funciona una integración de facturación electrónica con SUNAT utilizando **TypeScript, XML, UBL, firma digital y SOAP**.
El proyecto se encuentra en desarrollo y seguirá evolucionando a medida que se incorporen nuevas funcionalidades, pruebas y mejoras.

> ⚠️ Importante: Facturator es un proyecto independiente y no es un producto oficial de SUNAT. La funcionalidad verificada actualmente corresponde principalmente al entorno Beta. Antes de utilizarlo con comprobantes reales, se recomienda validar cuidadosamente la configuración y los requisitos vigentes de SUNAT.

---

## ✨ Características

* Generación de documentos electrónicos en XML UBL 2.1.
* Firma digital XML.
* Verificación de firmas digitales.
* Validación mediante esquemas XSD.
* Generación de archivos ZIP para SUNAT.
* Comunicación con SUNAT mediante SOAP.
* Envío de comprobantes mediante `sendBill()`.
* Envío de resúmenes mediante `sendSummary()`.
* Consulta de tickets mediante `getStatus()`.
* Soporte para entornos Beta y Production.
* Procesamiento de CDR.
* API orientada a proyectos Node.js y TypeScript, 🚧 En desarrollo 🧪 SUNAT Beta verificado 🇵🇪 Perú.


---

## 🧪 Estado de verificación

Estas son las funcionalidades que hemos probado actualmente contra **SUNAT Beta**:

| Funcionalidad             | Estado                                                                |
| ------------------------- | --------------------------------------------------------------------- |
| Generación de Invoice XML | ✅ Verificado                                                          |
| Firma digital             | ✅ Verificado                                                          |
| Verificación de firma     | ✅ Verificado                                                          |
| Validación XSD            | ✅ Verificado                                                          |
| `sendBill()`              | ✅ Verificado                                                          |
| `sendSummary()`           | ✅ Verificado                                                          |
| `getStatus()`             | ✅ Verificado                                                          |
| `sendPack()`              | 🧪 Implementado, pendiente de verificación                            |
| Entorno Production        | 🧪 Endpoint implementado, pendiente de validación con una cuenta real |

> El hecho de que una funcionalidad haya sido probada correctamente contra SUNAT Beta **no significa que el proyecto esté certificado por SUNAT ni que su comportamiento en Production esté garantizado**.

---

## 📦 Instalación

Con Yarn:

```bash
yarn add facturator
```

Con npm:

```bash
npm install facturator
```

---

## ⚙️ Configuración

Facturator necesita información del emisor, un certificado digital y las credenciales correspondientes de SUNAT.

```ts
import { Facturator } from 'facturator';

const facturator = new Facturator({
  ruc: process.env.SUNAT_RUC!,
  legalName: process.env.SUNAT_LEGAL_NAME!,

  signer: {
    privateKeyPath: './certs/private-key.pem',
    certificatePath: './certs/certificate.pem',
  },

  sunat: {
    username: process.env.SUNAT_USER!,
    password: process.env.SUNAT_PASSWORD!,
    environment: 'beta',
  },
});
```

### Entornos SUNAT

Para pruebas:

```ts
environment: 'beta'
```

Para Production:

```ts
environment: 'production'
```

Facturator selecciona internamente el endpoint correspondiente.

> ⚠️ Configurar `environment: 'production'` no significa que el emisor esté habilitado automáticamente para emitir comprobantes electrónicos. La configuración tributaria, credenciales, certificado digital y demás requisitos corresponden al contribuyente.

---

## 🧾 Crear una factura

```ts
const invoice = facturator.invoice({
  type: '03',
  series: 'B001',
  number: '00000001',
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
```

Puedes consultar los valores calculados:

```ts
console.log(invoice.total);
console.log(invoice.subtotal);
console.log(invoice.tax);
```

---

## ✍️ Firmar y validar

Antes de enviar el documento a SUNAT:

```ts
await invoice.sign();
```

Puedes verificar la firma:

```ts
const signatureValid = invoice.verifySignature();

console.log(signatureValid);
```

Y validar el XML contra el esquema XSD:

```ts
const valid = await invoice.validate();

console.log(valid);
```

---

## 📡 Enviar a SUNAT

Una vez firmado y validado:

```ts
const result = await facturator.send(invoice);

console.log(result);
```

El flujo interno es aproximadamente:

```text
Invoice
   │
   ▼
XML Builder
   │
   ▼
Digital Signature
   │
   ▼
XSD Validation
   │
   ▼
ZIP Packaging
   │
   ▼
SUNAT SOAP
   │
   ▼
CDR
```

---

## 📋 Resúmenes diarios

Facturator también permite construir y enviar resúmenes:

```ts
const result = await facturator.sendSummary(invoices);

console.log(result);
```

Para consultar el resultado de un proceso mediante su ticket:

```ts
const result = await facturator.getStatus(ticket);

console.log(result);
```

> El procesamiento de algunos documentos puede ser asíncrono. Una aplicación de producción debería implementar una estrategia adecuada de consulta/reintento en lugar de depender de una espera fija.

---

## 📦 `sendPack()`

Facturator incluye soporte para el envío de múltiples documentos mediante `sendPack()`:

```ts
const result = await facturator.sendPack(invoices);
```

La implementación existe, pero **todavía no ha sido verificada exitosamente contra SUNAT Beta**.

Por ese motivo, esta funcionalidad se considera experimental por ahora.

---

## 🔐 Certificado digital y credenciales

El firmador utiliza:

```ts
signer: {
  privateKeyPath: './certs/private-key.pem',
  certificatePath: './certs/certificate.pem',
}
```

Nunca publiques en Git:

* Claves privadas.
* Certificados sensibles.
* Credenciales de SUNAT.
* Archivos `.env`.

Por ejemplo:

```gitignore
.env
certs/
```

En aplicaciones reales, estos datos deberían almacenarse mediante mecanismos seguros de configuración y gestión de secretos.

---

## 🏗️ Arquitectura

Facturator está pensado como un **SDK de integración con SUNAT**, no como un sistema completo de facturación o punto de venta.

Su arquitectura principal es:

```text
Application
     │
     ▼
 Facturator
     │
     ├── XML Builder
     ├── XML Signer
     ├── XSD Validator
     ├── ZIP Packager
     ├── SUNAT Client
     └── CDR Parser
              │
              ▼
            SUNAT
```

Esto permite utilizar Facturator como una capa de integración dentro de aplicaciones más grandes, por ejemplo:

```text
POS / ERP / E-commerce
        │
        ▼
   Facturación
        │
        ▼
   Facturator
        │
        ▼
      SUNAT
```

En aplicaciones multi-tenant, cada contribuyente debería utilizar sus propias credenciales y certificado digital.

---

## 🧪 SUNAT Beta vs Production

El entorno Beta permite realizar pruebas sin utilizar directamente el entorno de producción.

Las pruebas realizadas durante el desarrollo de Facturator se han realizado principalmente contra **SUNAT Beta**.

Por lo tanto:

```text
SUNAT Beta
   ≠
SUNAT Production
```

Una prueba exitosa en Beta no constituye una certificación de Production.

Antes de utilizar Facturator con comprobantes reales, se debe verificar como mínimo:

* Estado y configuración del RUC.
* Habilitación como emisor electrónico.
* Credenciales de SUNAT.
* Certificado digital.
* Series y numeración.
* Configuración del entorno Production.
* Requisitos técnicos vigentes de SUNAT.
* Requisitos tributarios aplicables.

---

## 🤖 Desarrollo asistido por IA

Este proyecto fue desarrollado con asistencia de herramientas de inteligencia artificial durante el proceso de aprendizaje, implementación y depuración.

La asistencia de IA fue utilizada, entre otras cosas, para:

* Comprender especificaciones técnicas de SUNAT.
* Explorar estructuras XML y UBL.
* Trabajar con firmas digitales XML.
* Investigar y depurar errores SOAP y XML.
* Revisar implementaciones TypeScript.
* Analizar problemas de integración.
* Diseñar y mejorar partes del SDK.

La IA se utilizó como herramienta de apoyo para comprender conceptos, explorar especificaciones técnicas, revisar código, investigar errores y resolver problemas encontrados durante el desarrollo.

El proyecto también tiene un objetivo educativo: comprender mejor la facturación electrónica, XML, UBL, firmas digitales, SOAP y la integración con SUNAT.

---

## ⚠️ Disclaimer

Facturator es un proyecto independiente y de código abierto.

**No es un producto oficial de SUNAT ni representa a SUNAT.**

El proyecto no garantiza el cumplimiento automático de todos los requisitos presentes o futuros relacionados con la facturación electrónica en Perú.

Antes de utilizarlo en Production, cada implementación debe ser validada de acuerdo con los requisitos técnicos y tributarios vigentes.

El proyecto tiene principalmente un propósito educativo y de desarrollo, y busca convertirse progresivamente en una herramienta reutilizable para proyectos que necesiten integrarse con SUNAT.

Las especificaciones y requisitos de facturación electrónica pueden cambiar con el tiempo. Por ello, cualquier implementación que utilice Facturator para comprobantes reales debe realizar sus propias validaciones y mantenerse actualizada respecto a los requisitos vigentes.

El proyecto se publica con la intención de compartir el aprendizaje, recibir feedback de otros desarrolladores y continuar mejorándolo con el tiempo.

---

## 🗺️ Roadmap

Algunas mejoras previstas:

* [ ] Validación y pruebas en Production.
* [ ] Soporte para más tipos de CPE.
* [ ] Ampliación de pruebas automatizadas.
* [ ] Mejor manejo de errores SUNAT.
* [ ] Estrategias de retry y polling.
* [ ] Mejoras en el procesamiento de CDR.
* [ ] Mayor cobertura de operaciones SUNAT.
* [ ] Documentación adicional.
* [ ] Ejemplos de integración con aplicaciones reales.

---

## 🤝 Contribuciones

Los issues, reportes de errores y pull requests son bienvenidos.

Al reportar un problema relacionado con SUNAT, intenta incluir:

* Entorno utilizado (`beta` o `production`).
* Operación ejecutada.
* Código de error de SUNAT.
* Mensaje de error.
* Ejemplo mínimo para reproducir el problema.

**Nunca publiques en un issue:**

* Contraseñas.
* Claves privadas.
* Certificados.
* Credenciales de SUNAT.
* Información sensible de contribuyentes.

---

## 📄 Licencia

MIT License.

---

## 👨‍💻 Autor

Desarrollado por **Abraham Pacheco** como proyecto de aprendizaje e investigación sobre facturación electrónica, TypeScript e integración con SUNAT.

Repositorio:

https://github.com/AbrahamPG/sunat_cpe
