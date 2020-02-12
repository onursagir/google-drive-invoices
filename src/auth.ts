import inquirer from 'inquirer';
import { google } from 'googleapis';
import { getConfig, writeConfig } from './helpers';

export default async (): Promise<Record<string, unknown>> => {
  const config = await getConfig();

  try {
    const oAuthClient = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      'urn:ietf:wg:oauth:2.0:oob',
    );

    if (config.tokens) {
      oAuthClient.setCredentials(config.tokens);
    } else {
      const authURL = oAuthClient.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/drive'],
      });

      const { code } = await inquirer.prompt([
        {
          name: 'code',
          message: `Please visit the following URL and enter the displayed code ${authURL}`,
        },
      ]);

      const { tokens } = await oAuthClient.getToken(code);
      oAuthClient.setCredentials(tokens);


      await writeConfig({ ...config, tokens });
    }

    const drive = google.drive({ version: 'v3', auth: oAuthClient });

    return { drive };
  } catch (e) {
    const configWithoutTokens = { ...config };
    delete configWithoutTokens.tokens;

    await writeConfig(configWithoutTokens);

    throw e;
  }
};
