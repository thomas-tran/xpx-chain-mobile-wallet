import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Storage } from '@ionic/storage';
import { ToastController } from '@ionic/angular';
import { ProximaxProvider } from '../../../../providers/proximax.provider';
import { WalletService } from '../../service/wallet.service'

@Component({
  selector: 'app-wallet-send',
  templateUrl: './wallet-send.page.html',
  styleUrls: ['./wallet-send.page.scss'],
})
export class WalletSendPage implements OnInit {
  formSend: FormGroup;
  data: any;
  wallet: any;
  mosaic: { name: string; label: string; id: string; };
  mosaicsSelect: any;
  mosaics: any;
  cardMosaics: any;
  show: boolean;

  constructor(
    private activatedRoute: ActivatedRoute,
    public formBuilder: FormBuilder,
    private storage: Storage,
    public toastController: ToastController,
    private proximaxProvider: ProximaxProvider,
    private walletService: WalletService,
  ) { }

  ngOnInit() {
    this.wallet = this.walletService.current;
    this.show = false;
    this.mosaicsSelect = [
      {
        value: "0",
        label: "Select mosaic",
        selected: true,
        disabled: true
      }
    ];

    this.cardMosaics = [{
      name: "",
      mosaicId: "",
      amount: ""
    }]
    this.mosaics = this.walletService.mosaicsW;
    this.namemosaics(this.mosaics);
    this.mosaicsTransfer(this.mosaics);
    this.createForm();

  }

  createForm() {
    this.formSend = this.formBuilder.group({
      mosaicsSelect: [this.proximaxProvider.mosaicXpx.mosaicId],
      amount: ['', Validators.required],
      acountRecipient: ['', Validators.required],
      message: ['', Validators.required],
      password: ['', Validators.required],

    });
  }

  mosaicsTransfer(mosaics) {
    for (const m in mosaics) {
      const nameMosaic = (mosaics[m].name.length > 0) ? mosaics[m].name[0] : mosaics[m].mosaicId;
      this.mosaicsSelect.push({
        label: nameMosaic,
        value: mosaics[m].mosaicId,
        selected: false,
        disabled: false
      });
      console.log('naes. ', this.mosaicsSelect)
    }
  }

  onChangeMosaic(e) {

    const valor = this.mosaics;
    for (const m in valor) {
    if(valor[m].name[0] === e.trim() || valor[m].mosaicId === e.trim()) {
      this.cardMosaics =  valor[m];
      this.show = true;
    }
    }
    console.log('.............this.cardMosaics', this.cardMosaics)
  }
  namemosaics(mosaic) {
    if (mosaic === '0dc67fbe1cad29e3') {
      this.mosaic = {
        name: 'XPX',
        label: 'Proximax',
        id: '0dc67fbe1cad29e3'
      }
    } else {
      this.mosaic = {
        name: 'undefined',
        label: 'undefined',
        id: ''
      }
    }
  }

  onSubmit(form) {
    // if (this.formSend.invalid) {
    this.storage.get('pin').then(async (val) => {
      if (val === form.password) {
        console.log(' pin valido')
        const acountRecipient = form.acountRecipient;
        const amount = form.amount;
        const message = form.message;
        const password = form.password
        const mosaic = form.mosaicsSelect;
        const common = { password: password };

        if (this.walletService.decrypt(common)) {
          console.log('decrypt ')
          const rspBuildSend = this.walletService.buildToSendTransfer(
            common,
            acountRecipient,
            message,
            amount,
            this.walletService.network,
            mosaic
          );
          rspBuildSend.transactionHttp
            .announce(rspBuildSend.signedTransaction)
            .subscribe(
              async rsp => {
                const toast = await this.toastController.create({
                  message: 'Congratulations, Transaction sent.',
                  duration: 3000
                });
                toast.present();
                this.formSend.reset();
              },
              async err => {
                const toast = await this.toastController.create({
                  message: 'Error '.concat(err),
                  duration: 3000
                });
                toast.present();
              }
            );
        }
        console.log(form)
      } else {
        const toast = await this.toastController.create({
          message: 'Incorrect password.',
          duration: 3000
        });
        toast.present();
      }
    })
  }
}
