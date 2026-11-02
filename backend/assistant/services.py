from decimal import Decimal

from django.conf import settings

from catalogue.models import Product

from . import mock
from .admin_data import build_snapshot
from .llm import ask, parse_json
from .prompts import build_admin_system, build_customer_system
from .retrieval import product_line, relevant_products
from .safety import emergency_reply

MAX_HISTORY = 6
MAX_DRAFT_ITEMS = 10
CANT_ANSWER = ('Sorry, I could not work out an answer. Please try rephrasing your question, '
               'or contact our staff.')


def build_messages(history, message):
    """Cleans the history sent by the browser, then adds the new question."""
    cleaned = []
    for entry in history or []:
        role = entry.get('role')
        content = entry.get('content')
        if role not in ('user', 'assistant') or not isinstance(content, str):
            continue
        content = content.strip()[:1000]
        if not content:
            continue
        if cleaned and cleaned[-1]['role'] == role:
            cleaned[-1] = {'role': role, 'content': content}
        else:
            cleaned.append({'role': role, 'content': content})
    cleaned = cleaned[-MAX_HISTORY:]
    while cleaned and cleaned[0]['role'] != 'user':
        cleaned.pop(0)
    if cleaned and cleaned[-1]['role'] == 'user':
        cleaned.pop()
    return cleaned + [{'role': 'user', 'content': message}]


def validate_draft(raw_items):
    """Keeps only items that really exist, are active, and are in stock."""
    wanted = {}
    if isinstance(raw_items, list):
        for item in raw_items[:MAX_DRAFT_ITEMS]:
            if not isinstance(item, dict):
                continue
            try:
                product_id = int(item.get('product_id'))
                quantity = int(item.get('quantity', 1))
            except (TypeError, ValueError):
                continue
            if quantity < 1:
                continue
            wanted[product_id] = wanted.get(product_id, 0) + min(quantity, 1000)

    products = Product.objects.in_bulk(list(wanted))
    items, notes, total = [], [], Decimal('0.00')
    for product_id, quantity in wanted.items():
        product = products.get(product_id)
        if not product or not product.is_active:
            continue
        if product.stock_quantity == 0:
            notes.append(f'{product.name} is out of stock, so I left it out.')
            continue
        if quantity > product.stock_quantity:
            notes.append(f'Only {product.stock_quantity} of {product.name} are available, '
                         'so I reduced the quantity.')
            quantity = product.stock_quantity
        line_total = product.price * quantity
        items.append({
            'product_id': product.id,
            'product_name': product.name,
            'pack_size': product.pack_size,
            'quantity': quantity,
            'unit_price': str(product.price),
            'line_total': str(line_total),
        })
        total += line_total
    return items, notes, total


def _answer_from(raw):
    parsed = parse_json(raw)
    if parsed is not None:
        return parsed
    if raw.lstrip().startswith(('{', '[')):
        return {'answer': CANT_ANSWER}
    return {'answer': raw}


def customer_reply(message, history=None):
    emergency = emergency_reply(message)
    if emergency:
        return {'answer': emergency, 'draft': None}

    products = relevant_products(message)
    if settings.AI_PROVIDER == 'mock':
        parsed = mock.customer_parsed(message, products)
    else:
        system = build_customer_system([product_line(p) for p in products])
        parsed = _answer_from(ask(system, build_messages(history, message)))

    answer = str(parsed.get('answer') or '').strip() or CANT_ANSWER
    items, notes, total = validate_draft(parsed.get('draft_items'))
    if notes:
        answer = f'{answer} {" ".join(notes)}'
    draft = {'items': items, 'total': str(total)} if items else None
    return {'answer': answer[:2000], 'draft': draft}


def admin_reply(message, history=None):
    snapshot = build_snapshot(message)
    if settings.AI_PROVIDER == 'mock':
        return {'answer': 'Here is the latest information from the system:\n' + snapshot[:1800]}
    parsed = _answer_from(ask(build_admin_system(snapshot), build_messages(history, message)))
    answer = str(parsed.get('answer') or '').strip() or CANT_ANSWER
    return {'answer': answer[:2000]}