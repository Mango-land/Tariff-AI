from os import path

basedir = path.abspath(path.dirname(__file__))

class Config:
    SECRET_KEY = '470b70e7-7191-4d5e-acdb-0ee1e1c36e6f'

    TEMPLATES_AUTO_RELOAD = True

    TEMPLATES_ROOT = path.join(basedir, 'templates')
    STATIC_ROOT = path.join(basedir, 'static')

    TARIFFS_ROOT = path.join(basedir, 'storage/tariffs')

    SQLALCHEMY_DATABASE_URI = 'sqlite:///' + path.join(basedir, 'tariffs.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
