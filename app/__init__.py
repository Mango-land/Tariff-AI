from flask import Flask

from config import Config

from .routes import api_blueprint
from .routes import page_blueprint

def create_app() -> Flask:
    app = Flask(__name__,
        template_folder=Config.TEMPLATES_ROOT,
        static_folder=Config.STATIC_ROOT)
    app.config.from_object(Config)

    app.register_blueprint(api_blueprint)
    app.register_blueprint(page_blueprint)

    return app