import base64
from datetime import datetime
from decimal import ROUND_UP, Decimal

import requests
from django.conf import settings
from django.core.cache import cache

TIMEOUT = 20


class DarajaError(Exception):
    """Raised when Daraja cannot be reached or refuses a request."""


def mpesa_amount(amount):
    """M-Pesa takes whole shillings, so any cents are rounded up."""
    return int(Decimal(amount).to_integral_value(rounding=ROUND_UP))


def callback_url():
    base = settings.DARAJA_CALLBACK_BASE_URL.rstrip('/')
    return f'{base}/api/payments/mpesa/callback/{settings.DARAJA_CALLBACK_SECRET}/'


def _check_settings():
    needed = [
        settings.DARAJA_CONSUMER_KEY, settings.DARAJA_CONSUMER_SECRET,
        settings.DARAJA_SHORTCODE, settings.DARAJA_PASSKEY,
        settings.DARAJA_CALLBACK_BASE_URL, settings.DARAJA_CALLBACK_SECRET,
    ]
    if not all(needed):
        raise DarajaError('M-Pesa is not set up yet. Check the Daraja settings in .env.')


def _url(path):
    return settings.DARAJA_BASE_URL.rstrip('/') + path


def get_access_token():
    _check_settings()
    cached = cache.get('daraja_access_token')
    if cached:
        return cached
    try:
        response = requests.get(
            _url('/oauth/v1/generate'),
            params={'grant_type': 'client_credentials'},
            auth=(settings.DARAJA_CONSUMER_KEY, settings.DARAJA_CONSUMER_SECRET),
            timeout=TIMEOUT,
        )
        data = response.json()
    except (requests.RequestException, ValueError):
        raise DarajaError('Could not reach M-Pesa. Please try again.') from None
    token = data.get('access_token')
    if response.status_code != 200 or not token:
        raise DarajaError('M-Pesa refused the access request. Check the consumer key and secret.')
    expires = int(data.get('expires_in', 3599))
    cache.set('daraja_access_token', token, max(expires - 60, 60))
    return token


def _password(timestamp):
    raw = f'{settings.DARAJA_SHORTCODE}{settings.DARAJA_PASSKEY}{timestamp}'
    return base64.b64encode(raw.encode()).decode()


def _post(path, payload):
    token = get_access_token()
    try:
        response = requests.post(
            _url(path), json=payload,
            headers={'Authorization': f'Bearer {token}'}, timeout=TIMEOUT)
        data = response.json()
    except (requests.RequestException, ValueError):
        raise DarajaError('Could not reach M-Pesa. Please try again.') from None
    return response.status_code, data


def stk_push(phone, amount, reference, description):
    """Asks Daraja to send the payment prompt to the customer's phone."""
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    payload = {
        'BusinessShortCode': settings.DARAJA_SHORTCODE,
        'Password': _password(timestamp),
        'Timestamp': timestamp,
        'TransactionType': 'CustomerPayBillOnline',
        'Amount': mpesa_amount(amount),
        'PartyA': phone,
        'PartyB': settings.DARAJA_SHORTCODE,
        'PhoneNumber': phone,
        'CallBackURL': callback_url(),
        'AccountReference': reference[:12],
        'TransactionDesc': description[:13],
    }
    status, data = _post('/mpesa/stkpush/v1/processrequest', payload)
    if status != 200 or str(data.get('ResponseCode')) != '0':
        raise DarajaError(
            data.get('errorMessage') or data.get('ResponseDescription')
            or 'M-Pesa did not accept the request.')
    return data


def stk_query(checkout_request_id):
    """Asks Daraja what happened to a payment. ResultCode is None while it is still processing."""
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    payload = {
        'BusinessShortCode': settings.DARAJA_SHORTCODE,
        'Password': _password(timestamp),
        'Timestamp': timestamp,
        'CheckoutRequestID': checkout_request_id,
    }
    status, data = _post('/mpesa/stkpushquery/v1/query', payload)
    if data.get('errorCode') == '500.001.1001':
        return {'ResultCode': None, 'ResultDesc': 'The payment is still being processed.'}
    if status != 200 or 'ResultCode' not in data:
        raise DarajaError(data.get('errorMessage') or 'Could not check the payment.')
    return data