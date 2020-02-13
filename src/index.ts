import yargs from 'yargs';
import auth from './auth';
import uploadModule from './upload';
import configModule from './config';

const args = yargs
  .command(configModule)
  .middleware(auth)
  .command(uploadModule)
  .help()
  .argv;
