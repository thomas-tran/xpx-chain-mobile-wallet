import { Component, Input } from '@angular/core';
import { Deadline, Address, TransferTransaction } from 'tsjs-xpx-chain-sdk';

import { WalletProvider } from '../../../../../providers/wallet/wallet';
import { UtilitiesProvider } from '../../../../../providers/utilities/utilities';
import { App } from '../../../../../providers/app/app';
import { MosaicsProvider } from '../../../../../providers/mosaics/mosaics';
import { ProximaxProvider } from '../../../../../providers/proximax/proximax';
import { DefaultMosaic } from '../../../../../models/default-mosaic';

/**
 * Generated class for the TransferDetailComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'transfer-detail',
  templateUrl: 'transfer-detail.html'
})
export class TransferDetailComponent {
  @Input() tx: TransferTransaction;
  @Input() mosaics: DefaultMosaic[] = [];
  App = App;
  owner: Address;

  private async _getMosaicInfo() {

    // Get mosaic details
    this.mosaics = this.mosaics.filter(m1 => {
      return this.tx.mosaics.filter(m2 => {
        return m2.id.id.toHex() === m1.hex
      })
    }).map(m1=>{
      return this.tx.mosaics.map(m2 => {
        return new DefaultMosaic(
          {
            namespaceId: m1.namespaceId,
            hex: m1.hex,
            mosaicId: m1.mosaicId,
            amount: m2.amount.compact() / Math.pow(10, m1.divisibility),
            divisibility: m1.divisibility
          }
          )
      })
    })[0]

    console.log(this.mosaics);
  }

  private _setOwner() {
    this.wallet.getSelectedWallet().then(wallet => {
      this.owner = wallet.address;
    });
  }

  constructor(
    private wallet: WalletProvider,
    public utils: UtilitiesProvider,
    public mosaicsProvider: MosaicsProvider,
    private proximaxProvider: ProximaxProvider,
  ) {
    // console.log(this.tx);
  }

  ngOnInit() {
    this._setOwner();
    this._getMosaicInfo();
  }
}
