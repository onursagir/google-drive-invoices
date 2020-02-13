import { CommandModule, Arguments } from 'yargs';


export default {
  command: 'config',
  describe: 'Handle config file actions',
  builder: {
    setBaseDir: {},
    setClientId: {},
    setClientSecret: {},
    clearTokens: {},
  },
  handler: async (argv): Promise<void> => {
  },
} as CommandModule;
