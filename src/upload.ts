import fs from 'fs';
import path from 'path';
import Listr from 'listr';
import moment from 'moment';
import mimeTypes from 'mime-types';
import { drive_v3 } from 'googleapis';
import { CommandModule, Arguments } from 'yargs';
import { getConfig, findOrCreateFolder } from './helpers';

interface Argv extends Arguments {
  drive: drive_v3.Drive;
}

export default {
  command: 'upload [target]',
  describe: 'Upload files to Google Drive',
  builder: {
    target: {
      default: '.',
      description: 'File/folder to upload',
    },
    quarter: {
      alias: 'q',
      default: moment().quarter(),
      type: 'number',
      description: 'The quarter folder (defaults to current quarter)',
    },
    year: {
      alias: 'y',
      default: moment().year(),
      type: 'number',
      description: 'The year folder (defaults to current year)',
    },
    type: {
      alias: 't',
      type: 'string',
      default: 'received',
      description: 'Type of invoice, files will ultimately placed inside this folder, should be received or sent',
    },
  },
  handler: async (argv): Promise<void> => {
    const config = await getConfig();
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

          let files: Partial<fs.Dirent>[] = [];

          if (targetStat.isFile()) {
            files = [{ name: targetPath }];
          } else if (targetStat.isDirectory()) {
            files = (await fs.promises.readdir(targetPath, { withFileTypes: true }));
          }


          const targetDirName = `${config.baseDir}/${year}/Q${quarter}/${type}`;
          const longestFileNameLength = Math.max(...files.map((file) => {
            const filePath = path.resolve(process.cwd(), targetPath, file.name as string);
            return `${filePath} → ${targetDirName}`.length;
          }));

          const uploadTasks = files.reduce<Listr.ListrTask[]>((acc, file) => {
            const filePath = path.resolve(process.cwd(), targetPath, file.name as string);

            if (file.isDirectory && file.isDirectory()) return acc;

            return [
              ...acc,
              {
                title: `${filePath} ${`→ ${targetDirName}`.padStart(longestFileNameLength - filePath.length, ' ')}`,
                task: async (): Promise<void> => {
                  await drive.files.create({
                    requestBody: {
                      name: path.basename(filePath),
                      parents: [ctx.targetDir.id],
                    },
                    media: {
                      mimeType: mimeTypes.lookup(filePath) as string,
                      body: fs.createReadStream(filePath),
                    },
                  });
                },
              }];
          }, []);

          return new Listr(uploadTasks, { concurrent: true });
        },
      },
    // See: https://github.com/SamVerschueren/listr/issues/133#issuecomment-526253865
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ], { collapse: false } as any);

    await tasks.run();
  },
} as CommandModule;
