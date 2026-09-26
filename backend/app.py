import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from config import Config
from models import db, AdminUser, Ticket
from routes import public_bp, admin_bp, payment_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # CORS configuration
    origins = app.config.get('CORS_ORIGINS', '*')
    CORS(app, resources={r"/api/*": {"origins": origins}}, supports_credentials=True)

    db.init_app(app)

    app.register_blueprint(public_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(payment_bp)

    # Security Headers
    @app.after_request
    def add_security_headers(response):
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'SAMEORIGIN'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
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
            print("[DB LOG] Tables PostgreSQL créées ou vérifiées avec succès.")
        except Exception as e:
            print(f"[DB LOG] PostgreSQL note: {e}. Validation fallback SQLite...")
            db.session.rollback()
            try:
                sqlite_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), 'instances'))
                os.makedirs(sqlite_dir, exist_ok=True)
                sqlite_path = os.path.join(sqlite_dir, 'award.db')
                app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{sqlite_path}"
                db.create_all()
                print("[DB LOG] Base de données SQLite locale activée.")
            except Exception as sqle:
                print(f"[DB LOG] SQLite fallback note: {sqle}")

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
            admin_pass = os.getenv('ADMIN_PASSWORD')
            if not admin_pass and app.config.get('FLASK_ENV') != 'production':
                admin_pass = 'admin123'

            if admin_pass:
                admin = AdminUser.query.filter_by(username=admin_user).first()
                if not admin:
                    admin = AdminUser(username=admin_user, role='admin')
                    admin.set_password(admin_pass)
                    db.session.add(admin)
                    db.session.commit()
                    print(f"[ADMIN LOG] Compte administrateur '{admin_user}' créé avec succès.")
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
