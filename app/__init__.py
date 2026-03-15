from flask import Flask

from .config import Config

from .routes import page_bp
from .routes import api_bp

from .models import database
from .models import Tariff

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    app.register_blueprint(page_bp)
    app.register_blueprint(api_bp, url_prefix='/api')

    database.init_app(app)

    with app.app_context():
        database.create_all()

        #models.add_tariffs()

    return app