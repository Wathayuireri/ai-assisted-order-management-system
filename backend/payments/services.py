from decimal import Decimal, InvalidOperation

from django.utils import timezone

from .daraja import mpesa_amount


def amount_matches(payment, paid_amount):
    try:
        return Decimal(str(paid_amount)) == Decimal(mpesa_amount(payment.amount))
    except InvalidOperation:
        return False


def apply_result(payment, code, description='', receipt='', paid_amount=None):
    """Applies a result from Daraja to a payment.

    Only a pending payment can change, so a repeated callback does nothing.
    The caller must hold a database lock on the payment.
    """
    if payment.status != 'pending':
        return False

    payment.completed_at = timezone.now()
    payment.result_description = (description or '')[:200]

    if code == 0:
        if paid_amount is not None and not amount_matches(payment, paid_amount):
            payment.status = 'failed'
            payment.result_description = 'The amount paid did not match the order.'
        else:
            payment.status = 'success'
            payment.mpesa_receipt = (receipt or '')[:50]
    elif code == 1032:                      # the customer cancelled the prompt
        payment.status = 'cancelled'
    else:
        payment.status = 'failed'

    payment.save()
    return True