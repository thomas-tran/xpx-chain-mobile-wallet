import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { IonicPage, NavController, NavParams, ViewController } from 'ionic-angular';

import { SimpleWallet, Password, NetworkType} from 'tsjs-xpx-chain-sdk';


import { App } from '../../../../../providers/app/app';
// import { NemProvider } from '../../../../../providers/nem/nem';
import { UtilitiesProvider } from '../../../../../providers/utilities/utilities';
import { AlertProvider } from '../../../../../providers/alert/alert';
import { AuthProvider } from '../../../../../providers/auth/auth';
import { HapticProvider } from '../../../../../providers/haptic/haptic';
import { TranslateService } from '@ngx-translate/core';
import { ProximaxProvider } from '../../../../../providers/proximax/proximax';
import * as BcryptJS from "bcryptjs";
import { WalletProvider } from '../../../../../providers/wallet/wallet';

/**
 * Generated class for the SendMosaicConfirmationPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-send-mosaic-confirmation',
  templateUrl: 'send-mosaic-confirmation.html'
})
export class SendMosaicConfirmationPage {
  App = App;
  formGroup: FormGroup;
  currentWallet: SimpleWallet;

  credentials: { password: string; privateKey: string };

  data: any;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public formBuilder: FormBuilder,
    private alertProvider: AlertProvider,
    private authProvider: AuthProvider,
    public utils: UtilitiesProvider,
    private viewCtrl: ViewController,
    private haptic: HapticProvider,
    private translateService: TranslateService,
    private proximaxProvider: ProximaxProvider,
    private walletProvider: WalletProvider
  ) {
    this.init();
  }

  ionViewWillEnter() {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad SendMosaicConfirmationPage');
  }

  init() {
    // Inititalize empty fo  submission only
    this.formGroup = this.formBuilder.group({});

    // Get NavParams data
    console.log('navParams', this.navParams.data);
    this.data = this.navParams.data;
    this.currentWallet = <SimpleWallet>this.data.currentWallet;


    // Initialize private data
    this.authProvider.getPassword().then(password => {
      this.credentials = {
        password: password,
        privateKey: ''
      };
    })
  }

  goBack() {
    return this.navCtrl.pop();
  }

  onSubmit() {
    console.log('transactionType', this.data.transactionType);
    if (this.data.transactionType == 'multisig') {
      console.log("Multisig transfer");
      if (this._allowedToSendTx()) {
        // TODO: Multisig Send
      } else {
        this.showGenericError();
      }
    } else if (this.data.transactionType = 'normal'){
      console.log("Normal transfer");
      if (this._allowedToSendTx()) {

        const acountRecipient = this.data.recipientAddress;
        const amount = this.proximaxProvider.getAbsoluteAmount(this.data.amount);
        const message = this.data.message;
        const password =  this.credentials.password
        const mosaic = this.data.mosaic.hex;
        const common = { password: password };

        if (this.walletProvider.decrypt(common, this.data.currentWallet)) {

          const transferTransction = this.walletProvider.buildToSendTransfer(
            common,
            acountRecipient,
            message,
            amount,
            NetworkType.TEST_NET,
            mosaic
          );

          transferTransction.transactionHttp
            .announce(transferTransction.signedTransaction)
            .subscribe(
              value => {
                console.log('value ', value)
                this.showSuccessMessage()
              },
              async error => {
                console.log('error ', error)
                this.showErrorMessage(error)
              }
            );
        }
      } else {
        this.showGenericError();
      }
    }
  }

  showGenericError() {
    this.translateService.get('APP.ERROR').subscribe(
      value => {
        let alertTitle = value;
        this.alertProvider.showMessage(alertTitle);
      });

  }
  showErrorMessage(error) {
    this.haptic.notification({ type: 'warning' });
    console.log(error);
    if (error.toString().indexOf('FAILURE_INSUFFICIENT_BALANCE') >= 0) {
      this.alertProvider.showMessage(
        'Sorry, you don\'t have enough balance to continue the transaction.'
      );
    } else if (
      error.toString().indexOf('FAILURE_MESSAGE_TOO_LARGE') >= 0
    ) {
      this.alertProvider.showMessage(
        'The note you entered is too long. Please try again.'
      );
    } else if (error.statusCode == 404) {
      this.alertProvider.showMessage(
        'This address does not belong to this network'
      );
    } else if (error.toString().indexOf('FAILURE_TRANSACTION_NOT_ALLOWED_FOR_MULTISIG') >= 0) {
      this.alertProvider.showMessage(
        'Transaction is not allowed for multisignature enabled wallets.'
      );
    } else {
      // this.alertProvider.showMessage(
      //   'An error occured. Please try again.'
      // );
      this.alertProvider.showMessage(
        error
      );
    }
              
              
  }
  showSuccessMessage() {
    this.haptic.notification({ type: 'success' });
    this.alertProvider.showMessage(
      `You sent ${
      this.data.amount
      } ${this.data.mosaic.mosaicId.toUpperCase()} to ${
      this.data.recipientName || this.data.recipientAddress
      }`
    );
    this.utils.setTabIndex(2);
    this.navCtrl.setRoot(
      'TabsPage',
      {},
      {
        animate: true,
        direction: 'backward'
      }
    );
  }

  /**
   * User checking if it can do the send transaction.
   */
  private _allowedToSendTx() {
    // TODO: do some checking before send transaction
    
    if (this.credentials.password) {
      const myPassword = new Password(this.credentials.password);
      console.log('myPassword', myPassword)
        return true;
    }
    return false;
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }
}