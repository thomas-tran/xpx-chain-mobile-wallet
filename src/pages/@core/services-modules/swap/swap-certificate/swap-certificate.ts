import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController } from 'ionic-angular';
import { ToastProvider } from '../../../../../providers/toast/toast';
import { Clipboard } from '@ionic-native/clipboard';
import { Address } from 'tsjs-xpx-chain-sdk';
import { SocialSharing } from '@ionic-native/social-sharing';
import { TranslateService } from '@ngx-translate/core';
import { AppConfig } from '../../../../../app/app.config'


/**
 * Generated class for the SwapCertificatePage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-swap-certificate',
  templateUrl: 'swap-certificate.html',
})
export class SwapCertificatePage {
  publicKey: any;
  transactionHash: any;
  address: any;
  timestamp: Date;
  screenshotDone: boolean = false;
  url: string;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public viewCtrl: ViewController,
    private clipboard: Clipboard,
    private toastProvider: ToastProvider,
    private socialSharing: SocialSharing,
    public translateService: TranslateService,
  ) {
    this.publicKey = this.navParams.data.publicKey;
    this.transactionHash = this.navParams.data.transactionHash;
    let address = Address.createFromRawAddress(this.navParams.data.address.address);
    this.address = address.pretty();
    this.timestamp = new Date(this.navParams.data.timestamp);
    this.url = AppConfig.swap.urlExplorer.concat(this.transactionHash);
    // this.url = `http://testnet-explorer.nemtool.com/#/s_tx?hash=${this.transactionHash}`;
  }


  qrCreate() {
    let qr = qrcode(10, 'H')
    this.url;
    qr.addData(this.url);
    qr.make()
    // console.log('urlurlurl', url)
    return qr.createDataURL()
  }

  copy(val, string) {
    let label = ''
    if (string === 'address') {
      label = this.translateService.instant("WALLETS.ADDRESS.COPY")
    } else if (string === 'publicKey') {
      label = this.translateService.instant("WALLETS.EXPORT.COPY_PUBLIC_KEY.RESPONSE")
    } else if (string === 'hash') {
      label = this.translateService.instant("WALLETS.HASH.COPY")
    }

    this.clipboard.copy(val).then(_ => {
      this.toastProvider.show(label, 3, true);
    });
  }

  shared() {
    this.socialSharing
      .share(
        `${this.translateService.instant("WALLETS.TRANSACTION.DETAIL.DATE")}: ${this.timestamp} \n
         ${this.translateService.instant("SERVICES.SWAP_PROCESS.SIRIUS_WALLET")}: ${this.address} \n
         ${this.translateService.instant("WALLETS.TRANSACTION.DETAIL.HASH.NIS")}: ${this.transactionHash} \n`,
        null,
        null,
        this.url).then(_ => {
          this.dismiss();
        });
  }
  dismiss() {
    this.viewCtrl.dismiss();
    this.navCtrl.setRoot('TabsPage', { animate: true });
  }

}
