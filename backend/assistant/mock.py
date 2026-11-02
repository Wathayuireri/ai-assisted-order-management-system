import re

from .retrieval import keywords

ORDER_WORDS = re.compile(r'\b(order|buy|want|need|add|get|purchase)\b', re.IGNORECASE)
QUANTITY = re.compile(r'\b(\d{1,3})\b')


def customer_parsed(message, products):
    words = keywords(message)
    matches = []
    for product in products:
        haystack = ' '.join([
            product.name, product.category.name, product.description, product.intended_use,
        ]).lower()
        if any(word in haystack for word in words):
            matches.append(product)

    if not matches:
        return {
            'answer': ('I could not find a matching product in our list. '
                       'Please contact our staff through the Contact us page.'),
            'draft_items': [],
        }

    lines = [
        f'{p.name} ({p.pack_size}), KES {p.price}, '
        + ('in stock' if p.stock_quantity else 'out of stock')
        for p in matches[:4]
    ]
    answer = 'Here is what I found: ' + '; '.join(lines) + '.'

    draft = []
    if ORDER_WORDS.search(message):
        number = QUANTITY.search(message)
        quantity = int(number.group(1)) if number else 1
        first = next((p for p in matches if p.stock_quantity > 0), None)
        if first:
            draft = [{'product_id': first.id, 'quantity': max(quantity, 1)}]
            answer += ' I have drafted an order for you to review.'
    return {'answer': answer, 'draft_items': draft}