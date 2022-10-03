const {Keypair, PublicKey, Connection, clusterApiUrl, Transaction, SystemProgram} = require('@solana/web3.js');
const { createQR, createQROptions, encodeURL } = require('@solana/pay');
const bs58 = require('bs58');
const express = require('express');
const app = express();
const port = 3010;
const REQUEST_PATH = '/request';
const {BigNumber} = require('bignumber.js');
var path = require('path');


// const gatekeeperAuthority = Keypair.fromSecretKey(bs58.decode('QzSdRKirjb3Dq64ZoWkxyNwmNVgefWNrAcUGwJF6pVx9ZeiXYCWWc4eBFBYwgP5qBnwmX3nA6PYQqLuqSuuuFsx'));
// const gatekeeperNetwork = new PublicKey('tgnuXXNMDLK8dy7Xm1TdeGyc95MDym4bvAQCwcW21Bf');
const usdcSPLAddress = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
const shopAddress = new PublicKey('identv2kHTqjCU1tsgs83b1GgQBU4ukwv34QTctxS8x');
app.use(express.static('public'));
app.use(express.json())

app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);

app.get('/scripts/createQR.js', function(req, res) {
    res.sendFile(__dirname + '/node_modules/@solana/pay/lib/cjs/createQR.js');
});

app.get('/', (req, res) => {
    const requestUrl = req.protocol + '://' + req.get('host') + REQUEST_PATH;

    const amount = new BigNumber(10);
    const demoGatekeeperNetwork = Keypair.generate();
    const demoReference2 = Keypair.generate();

    const reference = [demoGatekeeperNetwork.publicKey, demoReference2.publicKey];

    const urlParams = {
        recipient: shopAddress,
        splToken: usdcSPLAddress,
        amount,
        reference,
        label: "Cookies Inc",
        message: "Thanks for your order! 🍪",
    }

    const url = encodeURL(urlParams)
    console.log({ url })

    const qr = createQROptions(url);

    res.render('qr.html', {
        url,
        qr,
    })
})

app.all(REQUEST_PATH, async(request, response) => {
    console.log(JSON.stringify(request.headers));
    console.log(JSON.stringify(request.body));

    if(request.method === 'GET') {
        console.log("Received initial GET request");

        const label = 'Identity.com SolPay Sample';
        const icon = 'https://exiledapes.academy/wp-content/uploads/2021/09/X_share.png';

        response.status(200).send({
            label,
            icon,
        });
    } else if(request.method === 'POST') {
        console.log(`Received POST request for account ${request.body.account}`);

        const owner = new PublicKey(request.body.account);
        const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');



        // const service = new GatekeeperService(
        //     connection,
        //     gatekeeperNetwork,
        //     gatekeeperAuthority,
        // );
        //
        // let transaction = await service.issue(owner, {
        //     feePayer: owner,
        //     rentPayer: owner,
        // });

        const { blockhash } = await connection.getRecentBlockhash();

        const transaction = new Transaction({
            recentBlockhash: blockhash,
            feePayer: owner
        }).add(
            SystemProgram.transfer({
                fromPubkey: owner,
                toPubkey: owner,
                lamports: 0,
            })
        );

        const serializedTransaction = transaction.serialize({
            verifySignatures: false,
            requireAllSignatures: false,
        });

        const base64Transaction = serializedTransaction.toString('base64');
        const message = 'Your token has been issued';

        response.status(200).send({ transaction: base64Transaction, message });
    }
})

app.listen(port, () => {
    console.log(`Solpay Demo started on port ${port}`)
})
