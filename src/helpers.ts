import fs from 'fs';
import path from 'path';
import Listr from 'listr';
import mimeTypes from 'mime-types';
import { drive_v3 } from 'googleapis';
import { Credentials } from 'google-auth-library/build/src/auth/credentials';

interface Config {
  clientId: string;
  baseDir?: string;
  clientSecret: string;
  tokens?: Credentials;
}

export const getConfig = async (): Promise<Config> => {
  const confContent = await fs.promises.readFile(path.resolve(__dirname, '../config.json'), 'utf-8');
  const configJSON = JSON.parse(confContent) as Config;

  return configJSON;
};

export const writeConfig = async (newConfig: Config): Promise<void> => {
  await fs.promises.writeFile(path.resolve(__dirname, '../config.json'), JSON.stringify(newConfig, null, 4));
};

interface FindOrCreateFolder {
  (drive: drive_v3.Drive, pathName: string): Promise<drive_v3.Schema$File>;
}

export const findOrCreateFolder: FindOrCreateFolder = async (drive, pathName) => {
  const [folder, parent] = pathName.split('/').reverse();

  const folderRes = await drive.files.list({
    q: `mimeType="application/vnd.google-apps.folder" and name="${folder}" ${parent ? `and "${parent}" in parents` : ''}`,
  });

  const [baseDir] = folderRes.data.files || [];

  if (!baseDir) {
    const baseDirCreateRes = await drive.files.create({
      requestBody: {
        name: folder,
        mimeType: 'application/vnd.google-apps.folder',
        ...(parent ? { parents: [parent] } : {}),
      },
    });

    return baseDirCreateRes.data;
  }

  return baseDir;
};
