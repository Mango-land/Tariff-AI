from flask_sqlalchemy import SQLAlchemy

database = SQLAlchemy()

from .tariff import Tariff

def add_tariffs():
    tariffs = [
        Tariff(name='Membrana',
               operator='mts',
               price=1900,
               gb=51,
               minutes=2010,
               sms=100,
               unlimited_messengers=True,
               unlimited_social=True,
               unlimited_video=True,
               unlimited_music=True,
               description='Для тех, кто управляет своим временем — настраивайте режимы приватности и окружение в сети',
               link='https://moskva.mts.ru/personal/mobilnaya-svyaz/tarifi/vse-tarifi/mts-membrana')
    ]

    database.session.add_all(tariffs)
    database.session.commit()