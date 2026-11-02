import re

from catalogue.models import Product

WORD = re.compile(r'[A-Za-z0-9]{3,}')
STOP = {
    'the', 'and', 'for', 'you', 'are', 'can', 'with', 'that', 'this', 'what', 'which',
    'have', 'has', 'how', 'does', 'any', 'your', 'from', 'about', 'need', 'want', 'some',
    'please', 'best', 'good', 'use', 'used', 'buy', 'order', 'get', 'should', 'would',
    'could', 'there', 'their', 'them', 'into', 'than', 'then', 'will', 'all', 'not', 'but',
}
SEND_ALL_UP_TO = 40     # a small catalogue is sent whole
LIMIT = 25              # a big one is cut down to the best matches


def keywords(text):
    return [w.lower() for w in WORD.findall(text) if w.lower() not in STOP][:10]


def relevant_products(question):
    products = list(
        Product.objects.filter(is_active=True).select_related('category').order_by('name')[:500])
    if len(products) <= SEND_ALL_UP_TO:
        return products

    words = keywords(question)

    def score(product): 
        haystack = ' '.join([
            product.name, product.category.name, product.description, product.intended_use,
        ]).lower()
        return sum(1 for word in words if word in haystack)

    ranked = sorted(products, key=score, reverse=True)
    return ranked[:LIMIT]


def product_line(product):
    stock = 'out of stock' if product.stock_quantity == 0 else f'{product.stock_quantity} in stock'
    parts = [
        f'[id {product.id}] {product.name}',
        f'category: {product.category.name}',
        f'pack size: {product.pack_size or "not given"}',
        f'price: KES {product.price}',
        f'stock: {stock}',
    ]
    if product.description:
        parts.append(f'description: {product.description[:300]}')
    if product.intended_use:
        parts.append(f'intended use: {product.intended_use[:300]}')
    return ' | '.join(parts)