import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';

import WasmProviderLite from './WasmProviderLite';
import Api from '@polkadot/api/promise';

import { start_client, default as init } from './node_browser.js';
import ws from './ws.js';

ReactDOM.render(<App />, document.getElementById('root'));

// ---

async function start() {
  /* Load WASM */
  console.log('Loading WASM');
  await init('./pkg/node_browser_bg.wasm');
  console.log('Successfully loaded WASM');

  /* Build our client. */
  console.log('Starting client');
  let client = start_client(ws());
  console.log('Client started');

  /* A) Use the client directly */
  client.rpcSubscribe('{"method":"chain_subscribeNewHead","params":[],"id":1,"jsonrpc":"2.0"}',
    (r: any) => console.log("[client] New chain head: " + r));
  client
    .rpcSend('{"method":"system_networkState","params":[],"id":1,"jsonrpc":"2.0"}')
    .then((r: any) => console.log("[client] Network state: " + r));

  /* B) Or use a Provider wrapper around the client */
  const wasmProviderLite = new WasmProviderLite(client);
  wasmProviderLite.send('system_networkState', []).then(r => {
    console.log('[WasmProviderLite] system_networkState resolved with', r)
  });
  wasmProviderLite.subscribe('n/a', 'chain_subscribeNewHead', [], (err: any, r: any) => console.log("[WasmProviderLite] Subscription notification : new chain head: ", r));

  /* C) Or use Api (typed responses) */
  Api.create({ provider: wasmProviderLite }).then((api: any) => {

    console.log('[Api] Runtime metadata', api.runtimeMetadata);

    api.rpc.chain.subscribeNewHead((header: any) => {
      console.log('[Api] Subscription message, new head', header.number.toNumber(), header);
    });

    api.rpc.system.networkState().then((state: any) => {
      console.log('[Api] Network state', state);
    })
  });
}

start();