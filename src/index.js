const {Keypair, PublicKey, Connection, clusterApiUrl, Transaction, SystemProgram} = require('@solana/web3.js');
const {GatekeeperService} = require('@identity.com/solana-gatekeeper-lib');
const bs58 = require('bs58');
const express = require('express');
const app = express();
const port = 3010;

const gatekeeperAuthority = Keypair.fromSecretKey(bs58.decode('QzSdRKirjb3Dq64ZoWkxyNwmNVgefWNrAcUGwJF6pVx9ZeiXYCWWc4eBFBYwgP5qBnwmX3nA6PYQqLuqSuuuFsx'));
const gatekeeperNetwork = new PublicKey('tgnuXXNMDLK8dy7Xm1TdeGyc95MDym4bvAQCwcW21Bf');

app.use(express.static('public'));
app.use(express.json())

app.all('/request', async(request, response) => {
    if(request.method === 'GET') {
        console.log("Received initlal GET request");

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

        const {blockhash} = await connection.getRecentBlockhash();

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