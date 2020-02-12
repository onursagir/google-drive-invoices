import fs from 'fs';
import path from 'path';
import Listr from 'listr';
import { drive_v3 } from 'googleapis';
import { CommandModule, Arguments } from 'yargs';
import { config, findOrCreateFolder, createFileUploadTasks } from './helpers';

interface Argv extends Arguments {
  drive: drive_v3.Drive;
}

export default {
  command: 'upload [target]',
  describe: 'Upload files to Google Drive',
  builder: {
    target: {
      default: '.',
      description: '@todo',
    },
    quarter: {
      alias: 'q',
      default: 4,
      type: 'number',
      description: '@todo',
    },
    year: {
      alias: 'y',
      default: 2020,
      type: 'number',
      description: '@todo',
    },
    type: {
      alias: 't',
      type: 'string',
      default: 'received',
      description: '@todo',
    },
  },
  handler: async (argv): Promise<void> => {
    const {
      drive, quarter, year, type, target,
    } = argv as Argv;

    if (!config.baseDir) throw new Error('Base directory is not set');

    const tasks = new Listr([
      {
        title: 'Resolving Google Drive directories',
        task: async (ctx): Promise<void> => {
          const baseDir = await findOrCreateFolder(drive, `root/${config.baseDir}`);
          const yearDir = await findOrCreateFolder(drive, `${baseDir.id}/${year}`);
          const quarterDir = await findOrCreateFolder(drive, `${yearDir.id}/Q${quarter}`);
          const targetDir = await findOrCreateFolder(drive, `${quarterDir.id}/${type}`);

          ctx.targetDir = targetDir;
        },
      },
      {
        title: 'Uploading file(s) to Google Drive',
        task: async (ctx): Promise<Listr> => {
          const targetPath = path.resolve(target as string);
          const targetStat = await fs.promises.stat(targetPath);

          let files: string[] = [];

          if (targetStat.isFile()) {
            files = [targetPath];
          } else if (targetStat.isDirectory()) {
            files = (await fs.promises.readdir(targetPath))
              .map((file) => path.resolve(targetPath, file));
          }

          const uploadTasks = createFileUploadTasks(drive, files, {
            name: `${config.baseDir}/${year}/q${quarter}/${type}`,
            id: ctx.targetDir.id,
          });

          return new Listr(uploadTasks, { concurrent: true });
        },
      },
    // See: https://github.com/SamVerschueren/listr/issues/133#issuecomment-526253865
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ], { collapse: false } as any);

    await tasks.run();
  },
} as CommandModule;
