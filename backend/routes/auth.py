import jwt
from datetime import datetime, timedelta
from functools import wraps
from flask import Blueprint, request, jsonify, current_app
from models import db, Admin

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({'message': 'Jeton d\'authentification manquant'}), 401
        
        try:
            payload = jwt.decode(token, current_app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
            current_admin = Admin.query.get(payload['admin_id'])
            if not current_admin:
                return jsonify({'message': 'Administrateur introuvable'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Session expirée, veuillez vous re-connecter'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Jeton d\'authentification invalide'}), 401

        return f(current_admin, *args, **kwargs)
    return decorated

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username_or_email = data.get('username') or data.get('email')
    password = data.get('password')

    if not username_or_email or not password:
        return jsonify({'message': 'Veuillez fournir un nom d\'utilisateur et un mot de passe'}), 400

    admin = Admin.query.filter(
        (Admin.username == username_or_email) | (Admin.email == username_or_email)
    ).first()

    if not admin or not admin.check_password(password):
        return jsonify({'message': 'Identifiants incorrects'}), 401

    token_payload = {
        'admin_id': admin.id,
        'username': admin.username,
        'role': admin.role,
        'exp': datetime.utcnow() + timedelta(days=7)
    }
    token = jwt.encode(token_payload, current_app.config['JWT_SECRET_KEY'], algorithm='HS256')

    return jsonify({
        'message': 'Connexion réussie',
        'token': token,
        'admin': admin.to_dict()
    })

@auth_bp.route('/me', methods=['GET'])
@admin_required
def get_current_user(current_admin):
    return jsonify({
        'admin': current_admin.to_dict()
    })
