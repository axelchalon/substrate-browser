/* eslint-disable @typescript-eslint/camelcase */
// Copyright 2017-2019 @polkadot/rpc-provider authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

// import { JsonRpcResponse, ProviderInterface, ProviderInterfaceCallback, ProviderInterfaceEmitted, ProviderInterfaceEmitCb } from '../types';

import EventEmitter from 'eventemitter3';
import { assert, isNull, isUndefined, logger } from '@polkadot/util';

import Coder from '@polkadot/rpc-provider/coder';

export type ProviderInterfaceCallback = (result: any) => void;
export type ProviderInterfaceEmitted = 'connected' | 'disconnected' | 'error';
export type ProviderInterfaceEmitCb = (value?: any) => any;
export interface ProviderInterface {
  readonly hasSubscriptions: boolean;
  clone(): ProviderInterface;
  disconnect(): void;
  isConnected(): boolean;
  on(type: ProviderInterfaceEmitted, sub: ProviderInterfaceEmitCb): void;
  send(method: string, params: any[]): Promise<any>;
  subscribe(type: string, method: string, params: any[], cb: ProviderInterfaceCallback): Promise<number>;
  unsubscribe(type: string, method: string, id: number): Promise<boolean>;
}

type CallbackHandler = (error?: null | Error, value?: any) => void;

interface SubscriptionHandler {
  callback: CallbackHandler;
  type: string;
}

const l = logger('api-wasmproviderlite');

/**
 * @name WasmProviderLite
 */
export default class WasmProviderLite implements ProviderInterface {
  private _eventemitter: EventEmitter;

  private _isConnected: boolean = false;

  private coder: Coder;

  private client: any;

  /**
   * @param {WasmClient} client
   */
  public constructor(client: any) {
    this._eventemitter = new EventEmitter();
    this.coder = new Coder();
    this.client = client;

    this._isConnected = true;
    this.emit('connected');
  }

  /**
   * @summary `true` when this provider supports subscriptions
   */
  public get hasSubscriptions(): boolean {
    return true;
  }

  /**
   * @description Returns a clone of the object
   */
  public clone(): WasmProviderLite {
    throw new Error('clone() is unimplemented yet.')
    // return new WasmProviderLite(this.client)
  }

  public connect(): void {
    console.error('connect is noop');
  }

  /**
   * @description Manually disconnect from the connection, clearing autoconnect logic
   */
  public disconnect(): void {
    console.error('disconnect is noop')
  }

  /**
   * @summary Whether the node is connected or not.
   * @return {boolean} true if connected
   */
  public isConnected(): boolean {
    return this._isConnected;
  }

  /**
   * @summary Listens on events after having subscribed using the [[subscribe]] function.
   * @param  {ProviderInterfaceEmitted} type Event
   * @param  {ProviderInterfaceEmitCb}  sub  Callback
   */
  public on(type: ProviderInterfaceEmitted, sub: ProviderInterfaceEmitCb): void {
    if (type == 'connected') { // should be handled by eventemitter but somehow doesn't work TODO
      sub();
    } else {
      this._eventemitter.on(type, sub);
    }
  }

  /**
   * @summary Send JSON data using WebSockets to the wasm node.
   * @param method The RPC methods to execute
   * @param params Encoded paramaters as appliucable for the method
   * @param subscription Subscription details (internally used)
   */
  public send(method: string, params: any[], subscription?: SubscriptionHandler): Promise<any> {

    if (subscription) {
      const json = this.coder.encodeJson(method, params);
      l.debug((): string[] => ['calling', method, json]);
      this.client.rpcSubscribe(json,(response: any) => {
        try {
          const result = this.coder.decodeResponse(JSON.parse(response));
          subscription.callback(null, result);
        } catch (error) {
          subscription.callback(error);
        }
      });
      return Promise.resolve(0); // TODO subscriptionId
    }

    return new Promise((resolve, reject): void => {
      try {
        const json = this.coder.encodeJson(method, params);

        l.debug((): string[] => ['calling', method, json]);

        this.client.rpcSend(json).then((response: any) => {
          try {
            const result = this.coder.decodeResponse(JSON.parse(response));
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * @name subscribe
   * @summary Allows subscribing to a specific event.
   * @param  {string}                     type     Subscription type
   * @param  {string}                     method   Subscription method
   * @param  {any[]}                 params   Parameters
   * @param  {ProviderInterfaceCallback} callback Callback
   * @return {Promise<number>}                     Promise resolving to the dd of the subscription you can use with [[unsubscribe]].
   *
   * @example
   * <BR>
   *
   * ```javascript
   * const provider = new WasmProvider(client);
   * const rpc = new Rpc(provider);
   *
   * rpc.state.subscribeStorage([[storage.balances.freeBalance, <Address>]], (_, values) => {
   *   console.log(values)
   * }).then((subscriptionId) => {
   *   console.log('balance changes subscription id: ', subscriptionId)
   * })
   * ```
   */
  public async subscribe(type: string, method: string, params: any[], callback: CallbackHandler): Promise<number> {
    const id = await this.send(method, params, { callback, type });

    return id as number;
  }

  /**
   * @summary Allows unsubscribing to subscriptions made with [[subscribe]].
   */
  public async unsubscribe(type: string, method: string, id: number): Promise<boolean> {
    console.error('unsubscribe is unimplemented');
    return false;
    // const subscription = `${type}::${id}`;

    // // FIXME This now could happen with re-subscriptions. The issue is that with a re-sub
    // // the assigned id now does not match what the API user originally received. It has
    // // a slight complication in solving - since we cannot rely on the send id, but rather
    // // need to find the actual subscription id to map it
    // if (isUndefined(this.subscriptions[subscription])) {
    //   l.debug((): string => `Unable to find active subscription=${subscription}`);

    //   return false;
    // }

    // delete this.subscriptions[subscription];

    // const result = await this.send(method, [id]);

    // return result as boolean;
  }

  private emit(type: ProviderInterfaceEmitted, ...args: any[]): void {
    this._eventemitter.emit(type, ...args);
  }
}
