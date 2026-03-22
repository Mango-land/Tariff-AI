import logging

import torch
import json
from model import LSTMModel

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(message)s'
)

logger = logging.getLogger(__name__)

SEQ_LEN = 80
NUM_LAYERS = 2
EMBED_SIZE = 256
HIDDEN_SIZE = 512

logger.info('Loading vocabulary...')

with open('model/vocab.json', 'r', encoding='utf-8') as file:
    stoi = json.load(file)

stoi = {k: int(v) for k, v in stoi.items()}
itos = {v: k for k, v in stoi.items()}

vocab_size = len(stoi)

logger.info(f'Vocabulary size: {vocab_size}')

def encode(s) -> list[int]:
    return [stoi.get(c, 0) for c in s if c in stoi]

def decode(l) -> str:
    return ''.join([itos.get(i, '?') for i in l])

logger.info('Initializing model...')

model = LSTMModel(
    vocab_size=vocab_size,
    embed_size=EMBED_SIZE,
    hidden_size=HIDDEN_SIZE,
    num_layers=NUM_LAYERS
)

logger.info('Loading model weights...')

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model.to(device)
model.load_state_dict(torch.load('model/model.pth', map_location=device))
model.eval()

logger.info('Model loaded successfully')

def generate(start_text: str, length=200, temperature=0.7) -> str:
    context = encode(start_text)

    if not context:
        raise ValueError('Start text contains no known characters!')

    hidden = None
    if len(context) > 1:
        warmup = context[:-1]
        x = torch.tensor([warmup], dtype=torch.long, device=device)
        with torch.no_grad():
            _, hidden = model(x, hidden)

    generated = list(context)

    for _ in range(length):
        ctx = generated[-SEQ_LEN:]
        if len(ctx) < SEQ_LEN:
            ctx = [0] * (SEQ_LEN - len(ctx)) + ctx

        x = torch.tensor([ctx], dtype=torch.long, device=device)

        with torch.no_grad():
            logits, hidden = model(x, hidden)

        logits = logits / temperature
        probs = torch.softmax(logits, dim=-1)

        next_char = torch.multinomial(probs, num_samples=1).item()
        generated.append(next_char)

    return decode(generated)


if __name__ == '__main__':
    print()

    while True:
        start = input()

        result = generate(start, length=300, temperature=0.7)
        print()
        print(result)
        print()