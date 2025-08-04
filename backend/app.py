from flask import Flask
from flask_cors import CORS
from backend.routes.api import api_bp
from backend.db_client import ping

def create_app():
    app = Flask(__name__)
    CORS(app)  # Enable CORS for all routes
    try:
        ping()
        app.logger.info("MongoDB connected.")
    except Exception as e:
        app.logger.error("DB connection failed: %s", e)
    app.register_blueprint(api_bp, url_prefix='/api')
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=8000, debug=True)
