import * as colors from 'colors.ts';
import * as ProxyServer from 'transparent-proxy';

colors.enable();

const server = new ProxyServer({
  upstream: () => 'proxy:12345@0.0.0.0:8888', // upstream to other proxy
});

server.listen(8886, '0.0.0.0', () => {
  console.log('TCP-Proxy-Server started!', server.address());
});
