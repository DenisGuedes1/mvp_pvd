from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from .config import config

db = SQLAlchemy()
jwt = JWTManager()

def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    CORS(app, origins=[
        "http://localhost:5173", 
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://localhost:5174"
    ])
    
    db.init_app(app)
    jwt.init_app(app)
    
    from .routes import main as main_blueprint
    app.register_blueprint(main_blueprint)
    
    return app


