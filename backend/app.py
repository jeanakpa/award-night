import os
from flask import Flask, send_from_directory, request
from flask_cors import CORS
from config import Config
from models import db, AdminUser, Ticket
from routes import public_bp, admin_bp, payment_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # CORS configuration
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    db.init_app(app)

    app.register_blueprint(public_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(payment_bp)

    # Dynamic CORS & Security Headers
    @app.after_request
    def add_security_headers(response):
        origin = request.headers.get('Origin')
        if origin:
            response.headers['Access-Control-Allow-Origin'] = origin
            response.headers['Access-Control-Allow-Credentials'] = 'true'
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'

        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'SAMEORIGIN'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        return response

    @app.route('/api/<path:path>', methods=['OPTIONS'])
    def handle_options(path):
        response = app.make_default_options_response()
        origin = request.headers.get('Origin')
        if origin:
            response.headers['Access-Control-Allow-Origin'] = origin
            response.headers['Access-Control-Allow-Credentials'] = 'true'
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
        return response

    # Route to serve local IMAGES
    images_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'IMAGES'))
    @app.route('/images/<path:filename>')
    def serve_image(filename):
        return send_from_directory(images_dir, filename)

    with app.app_context():
        try:
            db.session.rollback()
            db.create_all()
            print("[DB LOG] Tables créées ou vérifiées avec succès.")
        except Exception as e:
            print(f"[DB LOG] DB Init warning: {e}")
            try:
                db.session.rollback()
                db.create_all()
            except Exception as e2:
                print(f"[DB LOG] DB Init retry warning: {e2}")

        # Migration helper for new columns
        try:
            from sqlalchemy import text
            db.session.execute(text("ALTER TABLE tickets ADD COLUMN IF NOT EXISTS jeko_payment_id VARCHAR(100);"))
            db.session.execute(text("ALTER TABLE tickets ADD COLUMN IF NOT EXISTS redirect_url TEXT;"))
            db.session.commit()
        except Exception as e:
            db.session.rollback()

        # Seed default admin user safely from environment
        try:
            admin_user = os.getenv('ADMIN_USERNAME', 'admin')
            admin_pass = os.getenv('ADMIN_PASSWORD', 'admin123')

            if admin_pass:
                admin = AdminUser.query.filter_by(username=admin_user).first()
                if not admin:
                    admin = AdminUser(username=admin_user, role='admin')
                    admin.set_password(admin_pass)
                    db.session.add(admin)
                    db.session.commit()
                    print(f"[ADMIN LOG] Compte administrateur '{admin_user}' créé avec succès.")
                else:
                    admin.set_password(admin_pass)
                    db.session.commit()
                    print(f"[ADMIN LOG] Mot de passe administrateur '{admin_user}' mis à jour.")
        except Exception as e:
            db.session.rollback()
            print(f"[ADMIN LOG] Admin seed note: {e}")

    return app

app = create_app()

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug_mode = app.config.get('DEBUG', False)
    print(f"Démarrage du serveur backend Award Night sur port {port} (Debug: {debug_mode})")
    app.run(host='0.0.0.0', port=port, debug=debug_mode)
