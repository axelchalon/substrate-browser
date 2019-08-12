import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

import WasmProviderLite from './WasmProviderLite';
import Api from '@polkadot/api/promise';

import { start_client, default as init } from './node_browser.js';
import ws from './ws.js';

// tslint-disable-next-line
function log(msg: any) {
  console.log(msg);
}

async function start() {
  log('Loading WASM');
  await init('./pkg/node_browser_bg.wasm');
  log('Successfully loaded WASM');

  // Build our client.
  log('Starting client');
  let client = start_client(ws());
  log('Client started');

  const wasmProviderLite = new WasmProviderLite(client);

  Api.create({ provider: wasmProviderLite}).then((api: any) => {
    api.rpc.chain.subscribeNewHead((header: any) => {
      console.log('[Api] Subscription message, new head', header.number.toNumber(), header);
    });

    api.rpc.system.networkState().then((state: any) => {
      console.log('[Api] Network state', state);
    })
  });



  // Works:
    // wasmProviderLite.send('system_networkState', []).then(re => {
    //   console.log('[WasmProviderLite call] system_networkState resolved with',re)
    // });
    // wasmProviderLite.subscribe('n/a', 'chain_subscribeNewHead', [], (err: any, r: any) => console.log("[WasmProviderLite call] Subscription notification : new chain head: ", r));


  // client.rpcSubscribe('{"method":"chain_subscribeNewHead","params":[],"id":1,"jsonrpc":"2.0"}',
  //   (r: any) => log("[client] New chain head: " + r));

  // setInterval(() => {
  //   client
  //     .rpcSend('{"method":"system_networkState","params":[],"id":1,"jsonrpc":"2.0"}')
  //     .then((r: any) => log("[client] Network state: " + r));
  // }, 4000);
}

start();




















ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
