import {
  readdir,
  readFile,
} from 'node:fs/promises';

import {
  join,
  relative,
} from 'node:path';

import {
  createProjectValidator,
} from 'xerces-wasm';


export class XsdValidator {

  constructor(
    private readonly xsdRoot: string,
  ) {}


  async validate(
    xml: string,
    entrySchema: string,
  ) {

    const files: Record<
      string,
      string
    > = {};


    const entries =
      await readdir(
        this.xsdRoot,
        {
          recursive: true,
          withFileTypes: true,
        },
      );


    for (const entry of entries) {

      if (!entry.isFile()) {
        continue;
      }


      if (!entry.name.endsWith('.xsd')) {
        continue;
      }


      const fullPath =
        join(
          entry.parentPath,
          entry.name,
        );


      const relativePath =
        relative(
          this.xsdRoot,
          fullPath,
        ).replaceAll('\\', '/');


      files[relativePath] =
        await readFile(
          fullPath,
          'utf8',
        );
    }


    const validator =
      await createProjectValidator({
        entry: entrySchema,
        files,
      });


    const result =
      await validator.validate(
        xml,
      );


    validator.destroy();


    return result;
  }
}