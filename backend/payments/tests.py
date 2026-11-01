from unittest.mock import patch
from django.test import override_settings
from rest_framework.test import APITestCase

from payments.daraja import DarajaError
from payments.models import Payment
from orders.models import Order
from accounts.models import User
from catalogue.models import Product, Category 
from cart.models import Cart, CartItem 

# --- HELPER FUNCTIONS ---
def make_customer(email):
    return User.objects.create_user(
        username=email,
        email=email, 
        password='testpassword', 
        role='customer' 
    )

def make_product(price, stock):
    # 1. Create Category exactly as your model requires
    category = Category.objects.create(
        name='Test Category',
        description='A test category'
    )
    
    # 2. Create Product exactly as your model requires
    return Product.objects.create(
        category=category,
        name='Test Product',
        description='A test product description',
        price=price,
        stock_quantity=stock
    )

# --- FIRST TEST CLASS ---
class PaymentTests(APITestCase): 

    def setUp(self):
        self.customer = make_customer('test@example.com')
        self.client.force_authenticate(user=self.customer)
        
        self.order = Order.objects.create(
            user=self.customer,
            total_amount='2500.00',
            status='pending',
        )
        self.order_id = self.order.id
        
    def start(self):
        return self.client.post('/api/payments/start/', {
            'order_id': self.order_id,
            'phone': '254712345678',
            'amount': '2500.00'
        })

    def simulate(self, payment_id, status):
        return self.client.post(f'/api/payments/simulate/{payment_id}/', {
            'status': status
        })

    @override_settings(PAYMENT_MODE='off')
    def test_payments_are_refused_when_switched_off(self):
        self.assertEqual(self.start().status_code, 501)
        
        payment = Payment.objects.create(
            order_id=self.order_id, 
            phone='254712345678', 
            amount='2500.00'
        )
        self.assertEqual(self.simulate(payment.pk, 'success').status_code, 404)


# --- SECOND TEST CLASS ---
SECRET = 'test-secret'

def callback_body(checkout_id, code=0, amount=2500, receipt='QWE123ABC4'):
    stk = {
        'MerchantRequestID': 'm-1',
        'CheckoutRequestID': checkout_id,
        'ResultCode': code,
        'ResultDesc': ('The service request is processed successfully.'
                       if code == 0 else 'Request cancelled by user'),
    }
    if code == 0:
        stk['CallbackMetadata'] = {'Item': [
            {'Name': 'Amount', 'Value': amount},
            {'Name': 'MpesaReceiptNumber', 'Value': receipt},
            {'Name': 'PhoneNumber', 'Value': 254712345678},
        ]}
    return {'Body': {'stkCallback': stk}}


@override_settings(PAYMENT_MODE='daraja', DARAJA_CALLBACK_SECRET=SECRET)
class DarajaFlowTests(APITestCase):
    def setUp(self):
        self.customer = make_customer('a@example.com')
        product = make_product(price='1250.00', stock=10)
        cart, _ = Cart.objects.get_or_create(user=self.customer)
        CartItem.objects.create(cart=cart, product=product, quantity=2)
        self.client.force_authenticate(user=self.customer)
        
        # Note: If your Order model requires an address or reference, you might need to add it here
        self.order_id = self.client.post(
            '/api/orders/checkout/', {'contact_phone': '0712345678'}, format='json').data['id']

    def start(self):
        reply = {'CheckoutRequestID': 'ws_CO_TEST1',
                 'CustomerMessage': 'Success. Request accepted for processing'}
        with patch('payments.views.stk_push', return_value=reply):
            return self.client.post(
                '/api/payments/start/',
                {'order': self.order_id, 'mpesa_phone': '0712345678'}, format='json')

    def callback(self, body, secret=SECRET):
        self.client.force_authenticate(user=None)
        return self.client.post(
            f'/api/payments/mpesa/callback/{secret}/', body, format='json')

    def order_data(self):
        self.client.force_authenticate(user=self.customer)
        return self.client.get(f'/api/orders/{self.order_id}/').data

    def test_start_keeps_the_checkout_request_id(self):
        response = self.start()
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['checkout_request_id'], 'ws_CO_TEST1')
        self.assertEqual(response.data['status'], 'pending')

    def test_a_daraja_failure_marks_the_payment_failed(self):
        with patch('payments.views.stk_push', side_effect=DarajaError('M-Pesa is down')):
            response = self.client.post(
                '/api/payments/start/',
                {'order': self.order_id, 'mpesa_phone': '0712345678'}, format='json')
        self.assertEqual(response.status_code, 502)
        self.assertEqual(Payment.objects.get().status, 'failed')

    def test_a_successful_callback_marks_the_order_paid(self):
        self.start()
        self.assertEqual(self.callback(callback_body('ws_CO_TEST1')).status_code, 200)
        payment = Payment.objects.get()
        self.assertEqual(payment.status, 'success')
        self.assertEqual(payment.mpesa_receipt, 'QWE123ABC4')
        self.assertTrue(self.order_data()['is_paid'])

    def test_a_repeated_callback_changes_nothing(self):
        self.start()
        self.callback(callback_body('ws_CO_TEST1'))
        self.callback(callback_body('ws_CO_TEST1', code=1))
        self.assertEqual(Payment.objects.get().status, 'success')

    def test_a_wrong_amount_is_not_accepted_as_paid(self):
        self.start()
        self.callback(callback_body('ws_CO_TEST1', amount=1))
        self.assertEqual(Payment.objects.get().status, 'failed')
        self.assertFalse(self.order_data()['is_paid'])

    def test_a_cancelled_prompt_is_recorded(self):
        self.start()
        self.callback(callback_body('ws_CO_TEST1', code=1032))
        self.assertEqual(Payment.objects.get().status, 'cancelled')

    def test_a_wrong_secret_is_refused(self):
        self.start()
        response = self.callback(callback_body('ws_CO_TEST1'), secret='wrong')
        self.assertEqual(response.status_code, 404)
        self.assertEqual(Payment.objects.get().status, 'pending')

    def test_unknown_and_garbled_callbacks_are_ignored(self):
        self.assertEqual(self.callback(callback_body('nothing-like-this')).status_code, 200)
        self.assertEqual(self.callback({'hello': 'world'}).status_code, 200)
        self.assertEqual(Payment.objects.count(), 0)

    def test_the_status_check_picks_up_a_finished_payment(self):
        payment_id = self.start().data['id']
        with patch('payments.views.stk_query',
                   return_value={'ResultCode': 0, 'ResultDesc': 'Processed'}):
            response = self.client.post(f'/api/payments/{payment_id}/check/')
        self.assertEqual(response.data['status'], 'success')

    def test_the_status_check_leaves_a_payment_that_is_still_processing(self):
        payment_id = self.start().data['id']
        with patch('payments.views.stk_query',
                   return_value={'ResultCode': None, 'ResultDesc': 'Still processing'}):
            response = self.client.post(f'/api/payments/{payment_id}/check/')
        self.assertEqual(response.data['status'], 'pending')