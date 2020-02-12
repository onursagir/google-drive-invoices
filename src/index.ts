import yargs from 'yargs';
import auth from './auth';
import uploadModule from './upload';

const args = yargs
  .middleware(auth)
  .command(uploadModule)
  .help()
  .argv;
