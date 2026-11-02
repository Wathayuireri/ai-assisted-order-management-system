import re
from datetime import datetime, time, timedelta

from django.conf import settings
from django.db.models import Count, Prefetch
from django.utils import timezone

from catalogue.models import Product
from contact.models import ContactMessage
from orders.models import Order
from payments.models import Payment

DB = 'readonly'          # the MySQL account that can only read
REFERENCE = re.compile(r'\bCC-\d{3,}\b', re.IGNORECASE)


def _orders():
    return (Order.objects.using(DB)
            .select_related('user', 'user__profile')
            .prefetch_related(Prefetch('payments', queryset=Payment.objects.using(DB))))


def _payment_label(order):
    payments = list(order.payments.all())
    if any(p.status == 'success' for p in payments):
        return 'paid'
    if any(p.status == 'pending' for p in payments):
        return 'payment pending'
    if payments:
        return 'payment failed'
    return 'unpaid'


def _who(order):
    # No personal names, emails or phone numbers are ever put in this data.
    profile = getattr(order.user, 'profile', None)
    if profile and profile.customer_type == 'business':
        return f'business: {profile.company_name}' if profile.company_name else 'business'
    return 'individual customer'


def _order_line(order):
    when = timezone.localtime(order.created_at).strftime('%Y-%m-%d %H:%M')
    return (f'{order.reference} | {_who(order)} | KES {order.total_amount} | '
            f'status: {order.status} | {_payment_label(order)} | {when}')


def build_snapshot(question=''):
    lines = []
    today = timezone.localdate()
    day_start = timezone.make_aware(datetime.combine(today, time.min))

    lines.append(f'TODAY: {today.isoformat()}')

    counts = dict(Order.objects.using(DB).values_list('status').annotate(total=Count('id')))
    by_status = ', '.join(f'{key} {counts.get(key, 0)}' for key, _ in Order.STATUS_CHOICES)
    lines.append(f'ORDERS BY STATUS: {by_status}')
    placed_today = Order.objects.using(DB).filter(created_at__gte=day_start).count()
    lines.append(f'ORDERS PLACED TODAY: {placed_today}')

    open_filter = _orders().exclude(status__in=['delivered', 'cancelled'])
    open_total = open_filter.count()
    lines.append(f'OPEN ORDERS (not delivered or cancelled): {open_total}. Newest {min(open_total, 20)}:')
    for order in open_filter.order_by('-created_at')[:20]:
        lines.append('- ' + _order_line(order))

    active = Product.objects.using(DB).filter(is_active=True)
    low = active.filter(stock_quantity__gt=0, stock_quantity__lte=settings.LOW_STOCK_LEVEL)
    lines.append(f'LOW STOCK ({settings.LOW_STOCK_LEVEL} or fewer left):')
    for product in low.order_by('stock_quantity', 'name')[:20]:
        lines.append(f'- {product.name} {product.pack_size}: {product.stock_quantity} left')

    lines.append('OUT OF STOCK:')
    for product in active.filter(stock_quantity=0).order_by('name')[:20]:
        lines.append(f'- {product.name} {product.pack_size}')

    lines.append('ALL ACTIVE PRODUCTS AND STOCK:')
    for product in active.order_by('name')[:60]:
        lines.append(f'- {product.name} {product.pack_size}: {product.stock_quantity}')

    lines.append(
        f'UNREAD CONTACT MESSAGES: {ContactMessage.objects.using(DB).filter(is_read=False).count()}')
    week_ago = timezone.now() - timedelta(days=7)
    failed = Payment.objects.using(DB).filter(status='failed', created_at__gte=week_ago).count()
    waiting = Payment.objects.using(DB).filter(status='pending').count()
    lines.append(f'PAYMENTS: {failed} failed in the last 7 days, {waiting} waiting now')

    for reference in sorted({r.upper() for r in REFERENCE.findall(question)})[:3]:
        order = (_orders().prefetch_related('items', 'history')
                 .filter(reference=reference).first())
        if not order:
            lines.append(f'ORDER {reference}: not found')
            continue
        lines.append(f'ORDER {reference}: ' + _order_line(order))
        for item in order.items.all():
            lines.append(f'  - {item.quantity} x {item.product_name} at KES {item.unit_price}')
        for step in order.history.all():
            when = timezone.localtime(step.changed_at).strftime('%Y-%m-%d %H:%M')
            lines.append(f'  - {step.status} at {when}')

    return '\n'.join(lines)