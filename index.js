const express = require('express');
const axios = require('axios');
const tls = require('tls');

tls.DEFAULT_MIN_VERSION = 'TLSv1.3';

const app = express();
const port = 3000; // You can change the port as needed

// Middleware to parse JSON request bodies
app.use(express.json());

// Function to redeem voucher
async function redeemVoucher(phone_number, voucher_code) {
    voucher_code = voucher_code.replace('https://gift.truemoney.com/campaign/?v=', '');
    let res;
    if (!/^[a-z0-9]*$/i.test(voucher_code)) {
        res = {
            status: 'FAIL',
            reason: 'Voucher only allows English alphabets or numbers.'
        };
        return res;
    }
    if (voucher_code.length <= 0) {
        res = {
            status: 'FAIL',
            reason: 'Voucher code cannot be empty.'
        };
        return res;
    }
    const data = {
        mobile: `${phone_number}`,
        voucher_hash: `${voucher_code}`
    };
    try {
        const response = await axios.post(`https://gift.truemoney.com/campaign/vouchers/${voucher_code}/redeem`, data, {
            headers: { 'Content-Type': 'application/json' }
        });
        
        const resjson = response.data;
        if (resjson.status.code === 'SUCCESS') {
            res = {
                status: 'SUCCESS',
                amount: parseInt(resjson.data.voucher.redeemed_amount_baht)
            };
            return res;
        } else {
            res = {
                status: 'FAIL',
                reason: resjson.status.message
            };
            return res;
        }
    } catch (err) {
        return {
            status: 'FAIL',
            reason: 'Error while redeeming the voucher.'
        };
    }
}

// POST endpoint to redeem voucher
app.post('/redeem', async (req, res) => {
    const { phone_number, voucher_code } = req.body;

    if (!phone_number || !voucher_code) {
        return res.status(400).json({
            status: 'FAIL',
            reason: 'Missing phone_number or voucher_code'
        });
    }

    const result = await redeemVoucher(phone_number, voucher_code);
    res.json(result);
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
