import { spawn } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';

const php = process.platform === 'win32' ? 'php.exe' : 'php';
const viteArguments = [path.resolve('node_modules/vite/bin/vite.js'), ...process.argv.slice(2)];
const isPortAvailable = (port) => new Promise((resolve) => {
  const probe = net.createServer();
  probe.once('error', () => resolve(false));
  probe.once('listening', () => probe.close(() => resolve(true)));
  probe.listen(port, '127.0.0.1');
});

const backend = await isPortAvailable(8000)
  ? spawn(php, ['-S', '0.0.0.0:8000', '-t', 'public', 'public/router.php'], { stdio: 'inherit' })
  : null;
if (!backend) console.log('PHP API already running on http://127.0.0.1:8000');
const frontend = spawn(process.execPath, viteArguments, { stdio: 'inherit' });

let stopping = false;
const stop = (code = 0) => {
  if (stopping) return;
  stopping = true;
  backend?.kill();
  frontend.kill();
  process.exit(code);
};

process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
backend?.on('error', (error) => console.error(`Could not start the PHP API: ${error.message}`));
frontend.on('error', (error) => { console.error(`Could not start Vite: ${error.message}`); stop(1); });
frontend.on('exit', (code) => stop(code ?? 0));
