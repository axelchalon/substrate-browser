import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

import {WsProvider} from '@polkadot/api';
import Api from '@polkadot/api/promise';

Api.create({ provider: new WsProvider('wss://substrate-rpc.parity.io/')}).then((api: any) => {
  api.rpc.chain.subscribeNewHead((header: any) => {
  console.log(`new block #${header.number.toNumber()}`);
  })
});

ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
