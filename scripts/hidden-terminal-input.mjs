import { stdin, stdout } from 'node:process';

// Deliberately requires a real interactive terminal. Never echo hidden values.
export function terminalLine(label, { hidden = true, maxLength = 8192 } = {}) {
  return new Promise((resolve, reject) => {
    if (!stdin.isTTY || !stdout.isTTY || !stdin.setRawMode) {
      reject(new Error('WINDOWS_BOOTSTRAP_BLOCKED: Interactive terminal required.'));
      return;
    }
    let value = '';
    let ended = false;
    const finish = (error) => {
      if (ended) return;
      ended = true;
      stdin.off('data', onData);
      stdin.setRawMode(false);
      stdin.pause();
      stdout.write('\n');
      if (error) reject(error);
      else resolve(value);
    };
    const onData = (chunk) => {
      for (const char of chunk) {
        if (ended) return;
        if (char === '\u0003' || char === '\u0004') {
          finish(new Error('WINDOWS_BOOTSTRAP_BLOCKED: Input cancelled.'));
          return;
        }
        if (char === '\r' || char === '\n') {
          finish();
          return;
        }
        if (char === '\u007f' || char === '\b') {
          value = value.slice(0, -1);
          continue;
        }
        if (/^[\x20-\x7e]$/.test(char)) {
          if (value.length >= maxLength) {
            finish(new Error('WINDOWS_BOOTSTRAP_BLOCKED: Input too long.'));
            return;
          }
          value += char;
          if (!hidden) stdout.write(char);
        }
      }
    };
    stdin.setRawMode(true);
    stdin.setEncoding('utf8');
    stdin.on('data', onData);
    stdin.resume();
    stdout.write(label);
  });
}
