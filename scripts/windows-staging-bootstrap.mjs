import { stdin, stdout } from 'node:process';
import { terminalLine } from './hidden-terminal-input.mjs';
import { OWNER_CONFIRMATION, runStagingBootstrapQa } from './staging-bootstrap-qa.mjs';

async function run() {
  if (process.platform !== 'win32' || !stdin.isTTY || !stdout.isTTY) {
    throw new Error('WINDOWS_BOOTSTRAP_BLOCKED: Windows interactive PowerShell required.');
  }
  if (process.argv.length !== 2) {
    throw new Error('WINDOWS_BOOTSTRAP_BLOCKED: No command-line credentials or arguments.');
  }
  console.log('M-002 Windows staging synthetic admin QA (not a real admin setup).');
  console.log('Target: qfkjcjzwhewsbblgumco; max 1 temporary account, cleanup mandatory.');
  console.log('Credentials are hidden and used only in this process. Do not record the terminal.');
  const anonKey = await terminalLine('Legacy staging anon JWT (hidden): ');
  const serviceKey = await terminalLine('Legacy staging service_role JWT (hidden): ');
  const result = await runStagingBootstrapQa({
    anonKey,
    serviceKey,
    getPassword: async () => {
      const password = await terminalLine('Temporary admin password (hidden): ', {
        maxLength: 128,
      });
      const again = await terminalLine('Confirm temporary password (hidden): ', {
        maxLength: 128,
      });
      if (password !== again) {
        throw new Error('WINDOWS_BOOTSTRAP_BLOCKED: Password mismatch.');
      }
      return password;
    },
    getConfirmation: () =>
      terminalLine('Type ' + OWNER_CONFIRMATION + ' to create and delete the fixture: ', {
        hidden: false,
        maxLength: OWNER_CONFIRMATION.length,
      }),
  });
  console.log('WINDOWS_STAGING_BOOTSTRAP_PASS: ' + result + ' bounded checks.');
}

run().catch((error) => {
  // No exception stacks or unexpected messages containing secret material.
  const message = error instanceof Error ? error.message : '';
  console.error(
    message.startsWith('WINDOWS_BOOTSTRAP_')
      ? message
      : 'WINDOWS_BOOTSTRAP_FAILED: Unexpected error (details redacted).',
  );
  process.exitCode = 1;
});
