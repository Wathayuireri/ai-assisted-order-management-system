import re

EMERGENCY = re.compile(
    r"swallowed|drank|drunk it|ingested|poison|inhaled|can'?t breathe|cannot breathe|"
    r"unconscious|overdose|in (my|his|her|their|the) eyes?|splashed|chemical burn|burning my",
    re.IGNORECASE,
)

EMERGENCY_REPLY = (
    "This sounds like an emergency. If someone has swallowed a product, breathed in fumes, "
    "or got it in their eyes or on their skin, get medical help right away: call 999 or 112, "
    "or go to the nearest hospital, and follow the first-aid instructions on the product label. "
    "I cannot give medical advice."
)


def emergency_reply(message):
    return EMERGENCY_REPLY if EMERGENCY.search(message) else None