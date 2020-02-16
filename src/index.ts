#!/usr/bin/env node

import yargs from 'yargs';
import uploadModule from './upload';
import configModule from './config';

const args = yargs
  .command(configModule)
  .command(uploadModule)
  .help()
  .argv;
