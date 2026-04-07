import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import handler from 'serve-handler';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDirectory = join(__dirname, '..', 'dist');
const port = Number(process.env.PORT || 4173);

const server = createServer((request, response) => {
  handler(request, response, {
    public: publicDirectory,
    cleanUrls: true,
    rewrites: [{ source: '**', destination: '/index.html' }],
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`HDN Ride FE listening on port ${port}`);
});