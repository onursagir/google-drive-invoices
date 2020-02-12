#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const main = async (): Promise<void> => {
  await fs.promises.writeFile(path.resolve(__dirname, '../config.json'), '{}');
};

main();
