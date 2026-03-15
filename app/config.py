import os

basedir = os.path.abspath(os.path.dirname(__file__))

class Config:
    SECRET_KEY = '470b70e7-7191-4d5e-acdb-0ee1e1c36e6f'

    SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(basedir, 'tariffs.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
