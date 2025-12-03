import APIClient from "./apiClient"
import { API_AUTH } from "../config";
import {OfflineService, requireActiveSession, buildHeaders} from "../userModule"


export const paymentFn = async function(payload){

         if (!OfflineService.isOnline) {
    OfflineService.enqueue(() => paymentFn(payload));
    throw new Error("Offline: request queued");
        }
  await requireActiveSession();


   try {
    const payloads = {
        amount: 5000,
        currency: 'INR', receipt: 'rcpt_001'
    }

  const res = await APIClient.post("http://localhost:3000/api/v1/payment/order-create",  payloads || {}, {
    headers: buildHeaders(),
  });


    
  if(!res.order) return alert('Order creation failed');

  const order = res.order;

  const options = {
    key: "rzp_test_Rlp9PrQIMHPlFA",
        amount: order.amount,
        currency: order.currency,
        name: 'Karuvadukadai',
        description: 'Payment for goods',
        image: 'https://res.cloudinary.com/dzj11mc68/image/upload/v1760621584/logo_mtkwwr.png',
        order_id: order.id, // IMPORTANT
        handler: async function(response) {
               // response: { razorpay_payment_id, razorpay_order_id, razorpay_signature }
          // send these to server to verify

          const verifyResp = await APIClient.post('http://localhost:3000/api/v1/payment/order-create', response || {}, {
              headers: buildHeaders(),
          })

        
           if (verifyResp.ok) {
            alert('Payment successful and verified');
            // redirect to success page
          } else {
            alert('Payment verification failed');
            // show error to user
          }
        },

        theme: {
          color: '#c79a00' // optional
        }
  }

     const rzp = new Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        console.error('Payment failed', resp);
        alert('Payment failed: ' + (resp.error && resp.error.description));
      });
      rzp.open();
    

   } catch (error) {
    console.log('sjncijbcjbsbxksbckhb:', error)
   } 
    

}