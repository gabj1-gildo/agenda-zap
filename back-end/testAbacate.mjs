import { AbacatePay } from '@abacatepay/sdk';

import 'dotenv/config';

async function test() {
    try {
        const ap = AbacatePay({ secret: process.env.ABACATEPAY_API_KEY });
        const res = await ap.pix.create({
            amount: 5000,
            customer: {
                name: 'Cliente',
                cellphone: '553898982897',
                email: 'cliente@teste.com',
                taxId: '19119119100'
            }
        });
        console.log(res);
    } catch (e) {
        console.error(e);
    }
}
test();
