import { Injectable, OnInit } from "@angular/core";
import { Storage } from "@ionic/storage";
import { HttpClient, HttpHeaders } from "@angular/common/http";

import {
  NEMLibrary,
  NetworkTypes,
  AccountHttp,
  Password,
  SimpleWallet,
  Address,
  ServerConfig,
} from "nem-library";

import { Observable } from "rxjs";


@Injectable()
export class NemProvider{
  network: NetworkTypes;
  wallets: SimpleWallet[];
  accountHttp: AccountHttp;

  constructor(private storage: Storage, private http: HttpClient) {

    NEMLibrary.bootstrap(NetworkTypes.TEST_NET);
      this.accountHttp = new AccountHttp([{protocol: "http", domain:"18.231.166.212", port: 7890}]);
      console.log('this.accountHttp', this.accountHttp)

}
  /**
   * Create Wallet from private key
   * @param walletName wallet idenitifier for app
   * @param password wallet's password
   * @param privateKey account privateKey
   * @param selected network
   * * @return Promise with wallet created
   */
  public createPrivateKeyWallet(
    walletName,
    password,
    privateKey
  ): SimpleWallet {
    return SimpleWallet.createWithPrivateKey(
      walletName,
      new Password(password),
      privateKey
    );
  }

  public getAccountInfo(address: Address): Observable<any> {
    return this.accountHttp.getFromAddress(address);
  }

  public getMosaicsOwned(address: Address): Observable<any>{
    let url = "http://18.231.166.212:7890/account/mosaic/owned?address=" + address.plain();
    let headers = new HttpHeaders();
    return this.http.get(url, { headers: headers });
  }
}