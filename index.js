const express = require('express');
const fetch = require('node-fetch'); // Use node-fetch for HTTP requests
const tls = require('tls');

tls.DEFAULT_MIN_VERSION = 'TLSv1.3';

const app = express();
const port = 3000; // You can change the port as needed

// Middleware to parse JSON request bodies
app.use(express.json());

// Function to redeem voucher with retry logic
async function redeemVoucher(phone_number, voucher_code, retryCount = 3) {
    voucher_code = voucher_code.replace('https://gift.truemoney.com/campaign/?v=', '');
    let res;
    if (!/^[a-z0-9]*$/i.test(voucher_code)) {
        return {
            status: 'FAIL',
            reason: 'Voucher only allows English alphabets or numbers.'
        };
    }
    if (voucher_code.length <= 0) {
        return {
            status: 'FAIL',
            reason: 'Voucher code cannot be empty.'
        };
    }
    
    const data = {
        mobile: `${phone_number}`,
        voucher_hash: `${voucher_code}`
    };

    try {
        const response = await fetch(`https://gift.truemoney.com/campaign/vouchers/${voucher_code}/redeem`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const resjson = await response.json();

        if (resjson.status.code === 'SUCCESS') {
            return {
                status: 'SUCCESS',
                amount: parseInt(resjson.data.voucher.redeemed_amount_baht)
            };
        } else {
            return {
                status: 'FAIL',
                reason: resjson.status.message
            };
        }
    } catch (err) {
        if (retryCount > 0) {
            console.log(`Retrying... ${retryCount} attempts left`);
            return redeemVoucher(phone_number, voucher_code, retryCount - 1); // Retry logic
        }
        console.error('Error while redeeming the voucher:', err.message);
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
