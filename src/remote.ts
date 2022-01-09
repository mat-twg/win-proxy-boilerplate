import * as http from 'http';
import * as net from 'net';
import * as httpProxy from 'http-proxy';
import * as colors from 'colors.ts';

colors.enable();
const port = 8888;
const user = 'proxy';
const pswd = '12345';
const auth = 'Basic ' + Buffer.from(user + ':' + pswd).toString('base64');

const proxy = httpProxy.createServer();

const server = http.createServer((req, res) => {
  const target = new URL(req.url);
  console.log(`${new Date().toISOString()} > ${target.href}`.grey(15));
  const authHeader = req.headers['proxy-authorization'];
  if (authHeader !== auth) {
    res.write(
      'HTTP/' + req.httpVersion + ' 407 Proxy Authentication Required\r\n\r\n',
    );
    return res.end();
  }
  proxy.web(req, res, { target: target, secure: false }, (err) => {
    console.error(
      `${new Date().toISOString()} > ${target.href} : ${err.message}`.red,
    );
    res.end();
  });
});

server.on('connect', (req, socket) => {
  const authHeader = req.headers['proxy-authorization'];
  if (authHeader !== auth) {
    socket.write(
      'HTTP/' + req.httpVersion + ' 407 Proxy Authentication Required\r\n\r\n',
    );
    return socket.end();
  }
  const target = new URL(`https://${req.url}`);
  console.log(`${new Date().toISOString()} > ${target.href}`.grey(20));

  const proxySocket = new net.Socket();
  proxySocket.connect(parseInt(target.port) || 443, target.hostname, () => {
    socket.write(
      'HTTP/' + req.httpVersion + ' 200 Connection established\r\n\r\n',
    );
  });

  proxySocket.on('data', function (chunk) {
    socket.write(chunk);
  });

  proxySocket.on('end', function () {
    socket.end();
  });

  proxySocket.on('error', function (err) {
    console.error(
      `${new Date().toISOString()} > ${target.href} : ${err.message}`.red,
    );
    socket.end();
  });

  socket.on('data', (chunk) => {
    proxySocket.write(chunk);
  });

  socket.on('end', () => {
    proxySocket.end();
  });

  socket.on('error', (err) => {
    console.error(
      `${new Date().toISOString()} > ${target.href} : ${err.message}`.red,
    );
    proxySocket.end();
  });
});

server.listen(port, '0.0.0.0');
console.log(`Proxy server started on port: ${port}`.cyan);
