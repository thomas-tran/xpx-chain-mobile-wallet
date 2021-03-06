import { DefaultMosaic } from './../../../../models/default-mosaic';
import { NavParams, IonicPage, NavController, ViewController } from 'ionic-angular';
import { Component } from '@angular/core';
import { UtilitiesProvider } from '../../../../providers/utilities/utilities';
import { TransactionType, AggregateTransaction, Account, Password } from 'tsjs-xpx-chain-sdk';
import { WalletProvider } from '../../../../providers/wallet/wallet';
import { AuthProvider } from '../../../../providers/auth/auth';
import { ProximaxProvider } from '../../../../providers/proximax/proximax';
import { AlertProvider } from '../../../../providers/alert/alert';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConfigurationForm, SharedService } from '../../../../providers/shared-service/shared-service';
import { TranslateService } from '@ngx-translate/core';

/**
 * Generated class for the TransactionDetailPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-transaction-detail',
  templateUrl: 'transaction-detail.html'
})
export class TransactionDetailPage {
  public TransactionType = TransactionType;
  public tx: any;
  public mosaics: DefaultMosaic[] = [];
  public selectedAccount: Account;
  form: FormGroup;
  configurationForm: ConfigurationForm = {};
  isSelectedAccountMultisig: boolean = false;
  passwordType: string = "password";
  passwordIcon: string = "ios-eye-outline";
  currentAccount: any;
  status: any;
  cosignatories: any;

  constructor(
    private navParams: NavParams,
    private navCtrl: NavController,
    public formBuilder: FormBuilder,
    private utils: UtilitiesProvider,
    private viewCtrl: ViewController,
    public walletProvider: WalletProvider,
    public authProvider: AuthProvider,
    public proximaxProvider: ProximaxProvider,
    private sharedService: SharedService,
    public alertProvider: AlertProvider,
    private translateService: TranslateService,
  ) {
    this.configurationForm = this.sharedService.configurationForm;
    const payload = this.navParams.data;
    this.tx = payload.transactions;
    this.status = payload.status;
    this.mosaics = payload.mosaics;
    this.createForm()
    this.walletProvider.getAccountSelected().then(selectedAccount => {
      this.currentAccount = selectedAccount;
    });
    if (this.tx.innerTransactions && this.status === 'partials') {
      let address = this.tx.innerTransactions[0].signer.address;
      this.proximaxProvider.getMultisigAccountInfo(address).subscribe(result => {
        this.cosignatories = result.cosignatories;
        if (!!this.cosignatories.find(cosigneries => cosigneries.publicKey === this.currentAccount.publicAccount.publicKey)) {
          this.isSelectedAccountMultisig = true;
        }
      })
    }
  }

  /**
   *
   *
   * @param {AggregateTransaction} tx
   * @memberof TransactionDetailPage
   */
  cosign(tx: AggregateTransaction) {
    const password = new Password(this.form.get("password").value);
    const iv = this.currentAccount.account.encryptedPrivateKey.iv;
    const encryptedKey = this.currentAccount.account.encryptedPrivateKey.encryptedKey;
    const privateKey = this.proximaxProvider.decryptPrivateKey(password, encryptedKey, iv);
    const network = this.currentAccount.account.network;
    if (privateKey && privateKey !== '' && (privateKey.length === 64 || privateKey.length === 66)) {
      const account = Account.createFromPrivateKey(privateKey, network);
      this.proximaxProvider.cosignAggregateBondedTransaction(tx, account).subscribe(() => {
        this.alertProvider.showTranslated('TRANSACTION_DETAIL.COSIGN_DONE', 'TRANSACTION_DETAIL.COSIGN_MESSAGE').then(() => {
          this.viewCtrl.dismiss();
        });
      });
    } else {
      this.alertProvider.showMessage(this.translateService.instant("APP.INVALID.PASSWORD"));
    }
  }

  /**
   *
   *
   * @memberof TransactionDetailPage
   */
  createForm() {
    // Initialize form
    this.form = this.formBuilder.group({
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(this.configurationForm.passwordWallet.minLength),
          Validators.minLength(this.configurationForm.passwordWallet.minLength)
        ]
      ]
    });
  }

  /**
   *
   *
   * @memberof TransactionDetailPage
   */
  ionViewWillEnter() {
    this.utils.setHardwareBack(this.navCtrl);
  }

  /**
   *
   *
   * @memberof TransactionDetailPage
   */
  dismiss() {
    this.viewCtrl.dismiss();
  }

  /**
*
*
* @param {Event} e
* @memberof WalletInfoPage
*/
  showHidePassword(e: Event) {
    e.preventDefault();
    this.passwordType = this.passwordType === "password" ? "text" : "password";
    this.passwordIcon = this.passwordIcon === "ios-eye-outline" ? "ios-eye-off-outline" : "ios-eye-outline";
  }

  /**
   * 
   * @param tx 
   */
  toShowCosign(tx: AggregateTransaction): boolean {
    return tx.signer.publicKey === this.currentAccount.publicAccount.publicKey || this.status == 'confirmed' || !!tx.cosignatures.find(cosigner => cosigner.signer.publicKey === this.currentAccount.publicAccount.publicKey);
  }
}
