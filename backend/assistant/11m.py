import json
import re

import requests
from django.conf import settings


class AIError(Exception):
    """Raised when the AI service cannot be reached or gives an unusable reply."""


def ask(system, messages, max_tokens=700):
    """Sends the rules plus the conversation to the chosen provider, returns its text."""
    name = settings.AI_PROVIDER
    if name == 'anthropic':
        return _anthropic(system, messages, max_tokens)
    if name == 'openai_compatible':
        return _openai_compatible(system, messages)
    raise AIError(f'Unknown AI provider: {name}')


def _post(url, headers, payload):
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=settings.AI_TIMEOUT)
    except requests.RequestException as error:
        raise AIError('Could not reach the AI service.') from error
    try:
        data = response.json()
    except ValueError as error:
        raise AIError(f'Unreadable reply from the AI service (status {response.status_code}).') from error
    if response.status_code != 200:
        raise AIError(f'The AI service returned status {response.status_code}: {str(data)[:300]}')
    return data


def _anthropic(system, messages, max_tokens):
    if not settings.AI_API_KEY:
        raise AIError('AI_API_KEY is not set.')
    base = (settings.AI_BASE_URL or 'https://api.anthropic.com').rstrip('/')
    data = _post(
        f'{base}/v1/messages',
        {
            'x-api-key': settings.AI_API_KEY,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
        },
        {
            'model': settings.AI_MODEL,
            'max_tokens': max_tokens,
            'system': system,
            'messages': messages,
        },
    )
    text = ''.join(
        block.get('text', '') for block in data.get('content', []) if block.get('type') == 'text'
    ).strip()
    if not text:
        raise AIError('The AI service sent an empty reply.')
    return text


def _openai_compatible(system, messages):
    if not settings.AI_API_KEY:
        raise AIError('AI_API_KEY is not set.')
    base = (settings.AI_BASE_URL or 'https://api.openai.com/v1').rstrip('/')
    data = _post(
        f'{base}/chat/completions',
        {'Authorization': f'Bearer {settings.AI_API_KEY}', 'Content-Type': 'application/json'},
        {'model': settings.AI_MODEL,
         'messages': [{'role': 'system', 'content': system}, *messages]},
    )
    try:
        text = (data['choices'][0]['message']['content'] or '').strip()
    except (KeyError, IndexError, TypeError) as error:
        raise AIError('Unexpected reply from the AI service.') from error
    if not text:
        raise AIError('The AI service sent an empty reply.')
    return text


def parse_json(text):
    """Finds the JSON object in a reply, even if it is wrapped in code fences."""
    cleaned = re.sub(r'^```(?:json)?\s*|\s*```$', '', text.strip(), flags=re.IGNORECASE)
    start, end = cleaned.find('{'), cleaned.rfind('}')
    if start == -1 or end <= start:
        return None
    try:
        data = json.loads(cleaned[start:end + 1])
    except ValueError:
        return None
    return data if isinstance(data, dict) else None