import razorpay
import hmac
import hashlib
import logging
from django.conf import settings

logger = logging.getLogger(__name__)


def get_client():
    """Return an authenticated Razorpay client."""
    return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


def create_order(amount_in_paise, currency='INR', receipt=None, notes=None):
    """Create a Razorpay order.

    Args:
        amount_in_paise: Amount in paise (integer).
        currency: Currency code (default INR).
        receipt: Optional receipt identifier.
        notes: Optional dict of notes.

    Returns:
        Razorpay order dict containing 'id', 'amount', 'currency', etc.
    """
    client = get_client()
    payload = {
        'amount': amount_in_paise,
        'currency': currency,
    }
    if receipt:
        payload['receipt'] = receipt
    if notes:
        payload['notes'] = notes

    return client.order.create(data=payload)


def verify_payment_signature(razorpay_order_id, razorpay_payment_id, razorpay_signature):
    """Verify the payment signature returned by Razorpay checkout.

    Args:
        razorpay_order_id: The order_id from Razorpay.
        razorpay_payment_id: The payment_id from Razorpay.
        razorpay_signature: The signature from Razorpay.

    Returns:
        True if signature is valid, False otherwise.
    """
    try:
        client = get_client()
        client.utility.verify_payment_signature({
            'razorpay_order_id': razorpay_order_id,
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': razorpay_signature,
        })
        logger.info('Razorpay signature verified OK for order %s / payment %s',
                     razorpay_order_id, razorpay_payment_id)
        return True
    except Exception as e:
        logger.error('Razorpay signature verification FAILED for order %s / payment %s: %s (type: %s)',
                     razorpay_order_id, razorpay_payment_id, str(e), type(e).__name__, exc_info=True)
        return False
