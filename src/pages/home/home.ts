import { Component, ViewChild } from "@angular/core";
import {
  App,
  NavController,
  NavParams,
  ViewController,
  ActionSheetController,
  Platform,
  ModalController,
  Slides,
  LoadingController,
  LoadingOptions,
  Nav
} from "ionic-angular";
import {
  AccountInfo,
  TransactionType,
  Transaction,
  AggregateTransaction,
  PublicAccount,
} from "tsjs-xpx-chain-sdk";
import { TranslateService } from "@ngx-translate/core";
import { animate, style, transition, trigger } from "@angular/animations";
import { App as AppConfig } from "../../providers/app/app";
import { WalletProvider, CatapultsAccountsInterface } from "../../providers/wallet/wallet";
import { UtilitiesProvider } from "../../providers/utilities/utilities";
import { AlertProvider } from "../../providers/alert/alert";
import { HapticProvider } from "../../providers/haptic/haptic";
import { GetMarketPricePipe } from "../../pipes/get-market-price/get-market-price";
import { MosaicsProvider } from "../../providers/mosaics/mosaics";
import { TransactionsProvider } from "../../providers/transactions/transactions";
import { DefaultMosaic } from "../../models/default-mosaic";
import { ProximaxProvider } from '../../providers/proximax/proximax';

@Component({
  selector: "page-home",
  templateUrl: "home.html",
  animations: [
    trigger("itemState", [
      transition("void => *", [
        style({ transform: "translateX(-100%)" }),
        animate("250ms ease-out")
      ]),
      transition("* => void", [
        animate("250ms ease-in", style({ transform: "translateX(100%)" }))
      ])
    ])
  ],
  providers: [GetMarketPricePipe]
})
export class HomePage {
  amount: string;
  hex: string;

  mosaicName: string[];

  @ViewChild(Slides) slides: Slides;

  menu = "mosaics";
  AppConfig = AppConfig;

  mosaics: Array<DefaultMosaic> = [];
  accounts: Array<CatapultsAccountsInterface> = [];

  fakeList: Array<any>;
  data: any[] = [];
  totalWalletBalance = 0;

  App = App;
  TransactionType = TransactionType;

  unconfirmedTransactions: Array<Transaction> = [];
  aggregateTransactions: Array<AggregateTransaction> = [];
  confirmedTransactions = [];
  showEmptyTransaction: boolean = false;
  showEmptyMosaic: boolean = false;
  isLoading: boolean = false;

  tablet: boolean;

  selectedWallet: CatapultsAccountsInterface;
  selectedAccount: CatapultsAccountsInterface;
  accountInfo: AccountInfo;

  @ViewChild(Nav) navChild: Nav;
  address: any;

  constructor(
    public app: App,
    public actionSheetCtrl: ActionSheetController,
    public alertProvider: AlertProvider,
    public navCtrl: NavController,
    public navParams: NavParams,
    public viewCtrl: ViewController,
    public walletProvider: WalletProvider,
    public utils: UtilitiesProvider,
    public platform: Platform,
    private modalCtrl: ModalController,
    private haptic: HapticProvider,
    private marketPrice: GetMarketPricePipe,
    private translateService: TranslateService,
    public mosaicsProvider: MosaicsProvider,
    private transactionsProvider: TransactionsProvider,
    public loadingCtrl: LoadingController,
    private proximaxProvider: ProximaxProvider
  ) { }


  ionViewWillEnter() {
    this.utils.setHardwareBack();
    console.log('\n\n ------------ ionViewWillEnter ---> this.init() -------------------');
    this.init();
  }

  /**
   *
   *
   * @memberof HomePage
   */
  async init() {
    this.fakeList = [{}, {}];
    this.totalWalletBalance = 0;
    this.menu = "mosaics";

    if (window.screen.width >= 768) {
      // 768px portrait
      this.tablet = true;
    }

    let options: LoadingOptions = {
      content: "Loading..."
    };

    let loader = this.loadingCtrl.create(options);
    loader.present();
    this.totalWalletBalance = 0;
    this.showLoaders();
    this.walletProvider.getAccountsCatapult().then(catapulAccounts => {
      this.accounts = catapulAccounts;
      if (this.accounts.length > 0) {
        this.walletProvider.getAccountSelected().then(selectedAccount => {
          if (selectedAccount) {
            this.selectedAccount = selectedAccount;
          } else {
            this.selectedAccount = catapulAccounts[0];
          }

          // Slide to selected wallet
          /*this.accounts.forEach((acc, index) => {
            if (this.selectedAccount.account.name === acc.account.name) {
              this.slides.slideTo(index);
            }
          });*/
          
          this.address = this.proximaxProvider.createFromRawAddress(this.selectedAccount.account.address['address'])
          try {
            this.mosaicsProvider.getMosaics(this.address).subscribe(mosaics => {
              if (mosaics === null) {
                this.showEmptyMessage();
              } else {

                this.mosaics = mosaics;
                this.mosaicsProvider.computeTotalBalance(mosaics).then(total => {
                  this.totalWalletBalance = total as number;
                });

                console.log('\n\n  ---- INGRESA UNO ---- \n \n ');
                this.confirmedTransactions = [];
                this.getConfirmedTxn(this.selectedAccount.publicAccount);
                this.getTransactionsUnconfirmed(this.selectedAccount.publicAccount);
                this.getTransactionsAggregate(this.selectedAccount.publicAccount);
              }

            }, error => {
              console.log('error ', error);
            }
            );
          } catch (error) {
            console.log('error ', error);
            this.hideEmptyMessage();
            this.showEmptyMessage();
          }
        });
        this.hideEmptyMessage();
      } else {
        this.showEmptyMessage();
      }
      this.hideLoaders();
      loader.dismiss();
    });
  }

  /**
   *
   *
   * @param {CatapultsAccountsInterface} selectedAccount
   * @memberof HomePage
   */
  async onWalletSelect(selectedAccount: CatapultsAccountsInterface) {
    console.log('\n\n-----------onWalletSelect --> init()-----------------\n\n');

    if (this.selectedAccount.account === selectedAccount.account) {
      this.selectedAccount = selectedAccount;
    }

    await this.walletProvider.setSelectedAccount(selectedAccount).then(async () => {
      await this.init();
    });
  }



  /**
   *
   *
   * @param {CatapultsAccountsInterface} selectedAccount
   * @memberof HomePage
   */
  async showWalletDetails(selectedAccount: CatapultsAccountsInterface) {
    console.log('------------showWalletDetails ---> this.init() -------------------');
    this.selectedAccount = selectedAccount;
    let page = "TransactionListPage";
    let transactions = this.confirmedTransactions;
    let aggregateTransactions = this.aggregateTransactions;
    let total = this.totalWalletBalance;
    let mosaics = this.mosaics;
    let payload = { selectedAccount, transactions, aggregateTransactions, total, mosaics };
    const modal = this.modalCtrl.create(page, payload, {
      enableBackdropDismiss: false,
      showBackdrop: true
    });

    await modal.present().then(_ => {
      // this.init();
    });
  }

  /**
   *
   *
   * @param {*} refresher
   * @memberof HomePage
   */
  doRefresh(refresher: any) {
    console.log('\n\n ------------ Begin async operation ---> this.init() -------------------');
    setTimeout(async () => {
      this.mosaics = null; // Triggers the skeleton list loader
      try {
        await this.init();
        refresher.complete();
      } catch (error) {
        this.isLoading = false;
        refresher.complete();
      }
    }, 1500);
  }

  /**
   *
   *
   * @param {PublicAccount} publicAccount
   * @memberof HomePage
   */
  getConfirmedTxn(publicAccount: PublicAccount, id = null) {
    let options: LoadingOptions = {
      content: "Loading..."
    };

    let loader = this.loadingCtrl.create(options);
    loader.present();
    this.isLoading = true;
    this.transactionsProvider.getAllTransactionsFromAccount(publicAccount, id).subscribe(transactions => {
      this.isLoading = false;
      loader.dismiss();
      if (transactions.length > 0) {
        this.confirmedTransactions = (!this.confirmedTransactions) ? [] : this.confirmedTransactions;
        const txn = this.confirmedTransactions;
        transactions.forEach(element => {
          txn.push(element);
        });

        this.confirmedTransactions = txn;
        console.log('confirmedTransactions -----> ', this.confirmedTransactions);
      }
    }, error => {
      this.isLoading = false;
      loader.dismiss();
    });
  }

  /**
   *
   *
   * @memberof HomePage
   */
  slideChanged() {
    let currentIndex = this.slides.getActiveIndex();
    if (this.accounts.length != currentIndex) {
      this.onWalletSelect(this.accounts[currentIndex]);
      this.haptic.selection();
    } else {
      this.mosaics = null;
      this.isLoading = false;
      this.unconfirmedTransactions = null;
      this.confirmedTransactions = null;
      this.showEmptyTransaction = true;
      this.showEmptyMosaic = true;
    }
  }

  /**
   *
   *
   * @memberof HomePage
   */
  showWalletList() {
    console.log('\n\n AQUIIIII showWalletList');
    this.haptic.impact({ type: "heavy" });
    const page = "WalletListPage";
    this.utils.showInsetModal(page, { wallets: this.accounts }).subscribe(data => {
      console.log("SIRIUS CHAIN WALLET: HomePage -> showWalletList -> data", data);
      const account = data.account;
      const index = data.index;
      console.log('wallet', account);
      console.log('index', index);
      if (account) {
        this.slides.slideTo(index);
        this.onWalletSelect(account);
      }
    });
  }


  // -----------------------------------------------------------------------------------





  showEmptyMessage() {
    this.mosaics = null;
    this.confirmedTransactions = null;
    this.unconfirmedTransactions = null;
    this.showEmptyMosaic = true;
    this.showEmptyTransaction = true;
  }


  hideEmptyMessage() {
    this.showEmptyMosaic = false;
    this.showEmptyTransaction = false;
  }


  hideLoaders() {
    this.isLoading = false;
  }


  showLoaders() {
    this.isLoading = true;
    this.showEmptyTransaction = true;
    this.showEmptyMosaic = true;
    this.unconfirmedTransactions = null;
    this.aggregateTransactions = null;
    this.confirmedTransactions = null;
  }

  getTransactionsUnconfirmed(publicAccount: PublicAccount) {
    this.isLoading = true;
    this.transactionsProvider.getAllTransactionsUnconfirmed(publicAccount).subscribe(transactions => {
      if (transactions) {
        const transferTransactionsUnconfirmed: Array<Transaction> = transactions.filter(tx => tx.type == TransactionType.TRANSFER);
        this.unconfirmedTransactions = transferTransactionsUnconfirmed;
        // console.log(
        //   "this.unconfirmedTransactions ",
        //   this.unconfirmedTransactions
        // );
        this.showEmptyTransaction = false;
      } else {
        this.showEmptyTransaction = true;
      }
    });
    this.isLoading = false;
  }

  getTransactionsAggregate(publicAccount: PublicAccount) {
    this.isLoading = true;
    this.transactionsProvider.getAllTransactionsAggregate(publicAccount).subscribe(transactions => {
      // console.log('TCL: HomePage -> getTransactionsAggregate -> aggregateTransactions', transactions);
      if (transactions) {
        const transferTransactionsAggregate: Array<AggregateTransaction> = transactions.filter(tx => tx.innerTransactions[0].type == TransactionType.TRANSFER);
        this.aggregateTransactions = transferTransactionsAggregate;
        // console.log("this.aggregateTransactions ", this.aggregateTransactions);
        this.showEmptyTransaction = false;
      } else {
        this.showEmptyTransaction = true;
      }
    });
    this.isLoading = false;
  }

  getAbsoluteAmount(amount, divisibility) {
    return this.proximaxProvider.amountFormatter(amount, divisibility)
  }

  onWalletPress(wallet) {
    this.haptic.impact({ style: "heavy" });
    this.selectedWallet = wallet;
    let editButton = this.translateService.instant("WALLETS.EDIT");
    let deleteButton = this.translateService.instant("WALLETS.DELETE");
    let cancelButton = this.translateService.instant("WALLETS.BUTTON.CANCEL");

    const actionSheet = this.actionSheetCtrl.create({
      title: ``,
      cssClass: "wallet-on-press",
      buttons: [
        {
          text: editButton,
          icon: this.platform.is("ios") ? null : "create",
          handler: () => {
            this.navCtrl.push("WalletUpdatePage", { wallet: wallet });
          }
        },
        {
          text: deleteButton,
          role: "destructive",
          icon: this.platform.is("ios") ? null : "trash",
          handler: () => {
            let page = "WalletDeletePage";
            this.showModal(page, { wallet: wallet });
          }
        },
        {
          text: cancelButton,
          role: "cancel",
          icon: this.platform.is("ios") ? null : "close",
          handler: () => {
          }
        }
      ]
    });
    actionSheet.present();
  }

  async showAddWalletPrompt() {
    await this.alertProvider.showAddWalletPrompt().then(option => {
      if (option === "create") {
        this.navCtrl.push("WalletAddPage");
      } else {
        this.navCtrl.push("WalletAddPrivateKeyPage", {
          name: "",
          privateKey: "",
          password: ""
        });
      }
    });
  }

  public gotoWalletList() {
    this.utils.setRoot("TabsPage");
  }

  public gotoCoinPrice(mosaic) {
    let coinName: string;

    if (mosaic.mosaicId === "xem") {
      coinName = "nem";
    } else if (mosaic.mosaicId === "xpx") {
      coinName = "proximax";
    } else if (mosaic.mosaicId === "npxs") {
      coinName = "pundi-x";
    } else if (mosaic.mosaicId === "sft") {
      coinName = "sportsfix";
    } else {
      coinName = "";
    }

    this.marketPrice.transform(mosaic.mosaicId).then(price => {
      const totalBalance = mosaic.amount * price;
      const mosaicHex = mosaic.hex;
      const mosaicId = mosaic.mosaicId;
      const namespaceId = mosaic.namespaceId;
      const coinId = coinName;
      const selectedAccount = this.selectedAccount;
      const transactions = this.confirmedTransactions;
      const mosaicAmount = mosaic.amount;
      const mosaics = this.mosaics;
      const payload = {
        totalBalance,
        mosaicHex,
        mosaicId,
        namespaceId,
        coinId,
        selectedAccount,
        transactions,
        mosaicAmount,
        mosaics
      };
      let page = "CoinPriceChartPage";

      const modal = this.modalCtrl.create(page, payload, {
        enableBackdropDismiss: false,
        showBackdrop: true
      });
      modal.present();
    });
  }

  gotoTransactionDetail(tx) {
    const page = "TransactionDetailPage";
    const transactions = tx;
    const mosaics = this.mosaics;
    const payload = { transactions, mosaics };
    this.showModal(page, payload);
  }

  showReceiveModal() {
    const page = "ReceivePage";
    this.showModal(page, {});
  }

  showModal(page, params) {
    const modal = this.modalCtrl.create(page, params, {
      enableBackdropDismiss: false,
      showBackdrop: true
    });
    modal.present();
  }
}
