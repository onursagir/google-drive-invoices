import { CommandModule } from 'yargs';
import { getConfig, writeConfig } from './helpers';

interface Arguments {
  [x: string]: unknown;
  setBaseDir?: string;
  setClientId?: string;
  clearTokens?: boolean;
  setClientSecret?: string;
}

export default {
  command: 'config',
  describe: 'Handle config file actions',
  builder: {
    setBaseDir: {
      type: 'string',
    },
    setClientId: {
      type: 'string',
    },
    setClientSecret: {
      type: 'string',
    },
    clearTokens: {
      type: 'boolean',
    },
  },
  handler: async (argv: Arguments): Promise<void> => {
    const {
      setBaseDir, setClientId, setClientSecret, clearTokens,
    } = argv;

    let config = await getConfig();

    if (setBaseDir) config = { ...config, baseDir: setBaseDir };

    if (setClientId) config = { ...config, clientId: setClientId };

    if (setClientSecret) config = { ...config, clientSecret: setClientSecret };

    if (clearTokens) delete config.tokens;

    writeConfig(config);
  },
} as CommandModule;
