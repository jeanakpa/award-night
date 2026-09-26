import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from models import db, Category, Nominee, VoteTransaction, Setting

votes_bp = Blueprint('votes', __name__, url_prefix='/api/votes')

@votes_bp.route('/categories', methods=['GET'])
def get_categories():
    categories = Category.query.filter_by(is_active=True).order_by(Category.id.asc()).all()
    
    # Check registration settings
    deadline_str = Setting.get('self_registration_deadline')
    registration_open = True
    if deadline_str:
        try:
            deadline = datetime.fromisoformat(deadline_str)
            if datetime.utcnow() > deadline:
                registration_open = False
        except Exception:
            pass

    return jsonify({
        'categories': [c.to_dict(include_nominees=True) for c in categories],
        'registration_open': registration_open,
        'registration_deadline': deadline_str,
        'vote_price': current_app.config['VOTE_PRICE']
    })

@votes_bp.route('/self-register', methods=['POST'])
def self_register_nominee():
    # Check deadline
    deadline_str = Setting.get('self_registration_deadline')
    if deadline_str:
        try:
            deadline = datetime.fromisoformat(deadline_str)
            if datetime.utcnow() > deadline:
                return jsonify({'message': 'Les inscriptions de candidatures sont désormais fermées.'}), 400
        except Exception:
            pass

    data = request.get_json() or {}
    category_id = data.get('category_id')
    name = data.get('name')
    bio = data.get('bio')
    phone = data.get('phone')
    email = data.get('email')
    photo_url = data.get('photo_url') or 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'

    if not category_id or not name or not phone:
        return jsonify({'message': 'Veuillez renseigner la catégorie, votre nom complet et votre numéro de téléphone.'}), 400

    category = Category.query.get(category_id)
    if not category or not category.is_active or not category.allow_self_registration:
        return jsonify({'message': 'Cette catégorie n\'accepte pas d\'auto-inscriptions.'}), 400

    # Auto-approve or set pending based on app setting
    auto_approve = Setting.get('auto_approve_registrations', 'false').lower() == 'true'
    status = 'APPROVED' if auto_approve else 'PENDING'

    nominee = Nominee(
        category_id=category_id,
        name=name.strip(),
        bio=bio.strip() if bio else None,
        phone=phone.strip(),
        email=email.strip() if email else None,
        photo_url=photo_url,
        registration_type='SELF',
        status=status,
        vote_count=0
    )
    db.session.add(nominee)
    db.session.commit()

    message = 'Votre candidature a été enregistrée et approuvée !' if status == 'APPROVED' else 'Votre candidature a été soumise avec succès et est en cours de validation par l\'administration.'

    return jsonify({
        'message': message,
        'nominee': nominee.to_dict()
    }), 201

@votes_bp.route('/submit', methods=['POST'])
def submit_vote():
    data = request.get_json() or {}
    nominee_id = data.get('nominee_id')
    vote_count = int(data.get('vote_count', 1))
    voter_name = data.get('voter_name', 'Anonyme')
    voter_phone = data.get('voter_phone', '')

    if not nominee_id or vote_count <= 0:
        return jsonify({'message': 'Veuillez sélectionner un nominé et au moins 1 vote.'}), 400

    nominee = Nominee.query.get(nominee_id)
    if not nominee or nominee.status != 'APPROVED':
        return jsonify({'message': 'Ce nominé n\'est pas éligible au vote.'}), 404

    unit_price = current_app.config['VOTE_PRICE']
    total_amount = vote_count * unit_price
    tx_ref = f"VOTE-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6].upper()}"

    vote_tx = VoteTransaction(
        transaction_reference=tx_ref,
        nominee_id=nominee_id,
        voter_name=voter_name,
        voter_phone=voter_phone,
        vote_count=vote_count,
        unit_price=unit_price,
        total_amount=total_amount,
        payment_status='PENDING'
    )
    db.session.add(vote_tx)
    db.session.commit()

    return jsonify({
        'message': 'Session de vote initiée avec succès',
        'vote_transaction': vote_tx.to_dict(),
        'wave_launch_url': f"/api/wave/checkout?type=vote&ref={vote_tx.transaction_reference}"
    }), 201
