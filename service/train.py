import json
import logging
import os
import random

import torch
from torch import nn, optim

from model import LSTMModel

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(message)s'
)

logger = logging.getLogger(__name__)

DATASET_FOLDER = 'dataset'
BATCH_SIZE = 64
EPOCHS = 10
STEPS_PER_EPOCH = 1000

SEQ_LEN = 80
NUM_LAYERS = 2
EMBED_SIZE = 256
HIDDEN_SIZE = 512

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
logger.info(f'Using device: {device}')

def load_dataset(folder):
    text = ''
    for file in os.listdir(folder):
        path = os.path.join(folder, file)
        if not os.path.isfile(path):
            continue
        logger.info(f'Loading dataset file {path}')
        with open(path, 'r', encoding='utf-8') as f:
            text += f.read() + '\n'
    return text


logger.info('Loading dataset...')
text = load_dataset(DATASET_FOLDER)
logger.info(f'Dataset size: {len(text):,}')

chars = sorted(list(set(text)))
vocab_size = len(chars)
logger.info(f'Vocabulary size: {vocab_size:,}')

stoi = {ch: i for i, ch in enumerate(chars)}
itos = {i: ch for ch, i in stoi.items()}

def encode(s):
    return [stoi[c] for c in s]

data = torch.tensor(encode(text), dtype=torch.long).to(device)
logger.info(f'Dataset moved to {device}')

def get_batch():
    idx = torch.randint(0, len(data) - SEQ_LEN - 1, (BATCH_SIZE,), device=device)
    X = torch.stack([data[i:i + SEQ_LEN] for i in idx])
    Y = data[idx + SEQ_LEN]
    return X, Y

logger.info('Initializing model...')

VOCAB_PATH = 'model/vocab.json'
MODEL_PATH = 'model/model.pth'

model = LSTMModel(
    vocab_size=vocab_size,
    embed_size=EMBED_SIZE,
    hidden_size=HIDDEN_SIZE,
    num_layers=NUM_LAYERS
).to(device)

try:
    model = torch.compile(model)
    logger.info('Model compiled with torch.compile ✓')
except Exception:
    logger.info('torch.compile not available, skipping')

criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=0.001)
scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, patience=3, factor=0.5)

scaler = torch.amp.GradScaler(enabled=device.type == 'cuda')

logger.info('Start training...')

for epoch in range(EPOCHS):
    total_loss = 0
    model.train()

    for step in range(STEPS_PER_EPOCH + 1):
        X, Y = get_batch()

        optimizer.zero_grad(set_to_none=True)

        with torch.autocast(device_type=device.type, enabled=device.type == 'cuda'):
            outputs, _ = model(X)
            loss = criterion(outputs, Y)

        scaler.scale(loss).backward()
        scaler.unscale_(optimizer)
        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
        scaler.step(optimizer)
        scaler.update()

        total_loss += loss.item()

        if step % 10 == 0:
            logger.info(f'Epoch {epoch + 1}/{EPOCHS} | Step {step}/{STEPS_PER_EPOCH} | Loss: {loss.item():.4f}')

    avg_loss = total_loss / STEPS_PER_EPOCH
    logger.info(f'Epoch {epoch + 1} | Average Loss: {avg_loss:.4f}')
    scheduler.step(avg_loss)

os.makedirs('model', exist_ok=True)

with open(VOCAB_PATH, 'w', encoding='utf-8') as file:
    json.dump(stoi, file)

state_dict = model._orig_mod.state_dict() if hasattr(model, '_orig_mod') else model.state_dict()
torch.save(state_dict, MODEL_PATH)

logger.info('Training finished!')