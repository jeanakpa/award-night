from flask import Blueprint, request, jsonify, redirect, current_app
from models import db, Ticket
from services.jeko_service import create_jeko_payment_request, verify_jeko_payment, confirm_ticket_payment
from utils.helpers import get_lan_ip, extract_request_network_ip

payment_bp = Blueprint('payment', __name__)

@payment_bp.route('/api/payments/jeko-initiate', methods=['POST'])
def initiate_jeko_payment():
    try:
        data = request.get_json() or {}
        reference = data.get('reference')
        operator = data.get('operator', 'wave')

        if not reference:
            return jsonify({'error': 'Référence du billet requise.'}), 400

        ticket = Ticket.query.filter_by(reference=reference).first()
        if not ticket:
            return jsonify({'error': 'Billet non trouvé.'}), 404

        host_url = request.host_url.rstrip('/')
        result = create_jeko_payment_request(ticket, operator, host_url)
        return jsonify(result), 200
    except Exception as err:
        print(f"[JEKO INITIATE ERROR] {err}")
        return jsonify({'error': f'Erreur initialisation paiement: {str(err)}'}), 500

@payment_bp.route('/api/payments/jeko-callback', methods=['GET', 'POST'])
def jeko_callback():
    json_data = request.get_json(silent=True) or {}
    reference = request.args.get('reference') or json_data.get('reference')
    status = request.args.get('status') or json_data.get('status')
    payment_id = request.args.get('id') or json_data.get('id')

    request_host = extract_request_network_ip()
    frontend_url = current_app.config.get('FRONTEND_URL') or f"https://{request_host}"

    if not reference:
        return redirect(f"{frontend_url}/?payment_status=error", code=302)

    if status in ('error', 'failed'):
        ticket = Ticket.query.filter_by(reference=reference).first()
        if ticket:
            ticket.payment_status = 'FAILED'
            db.session.commit()
        return redirect(f"{frontend_url}/?page=error&ticket_ref={reference}&payment_status=error", code=302)

    try:
        result = verify_jeko_payment(reference, payment_id)
    except Exception as e:
        db.session.rollback()
        db.create_all()
        result = verify_jeko_payment(reference, payment_id)

    if result.get('success') or status == 'success':
        return redirect(f"{frontend_url}/?page=success&ticket_ref={reference}&payment_status=success", code=302)
    else:
        return redirect(f"{frontend_url}/?page=error&ticket_ref={reference}&payment_status=error", code=302)

@payment_bp.route('/api/payments/jeko-webhook', methods=['POST'])
def jeko_webhook():
    payload = request.get_json() or {}
    data = payload.get('data', payload)
    reference = data.get('reference')
    payment_status = data.get('status', '').lower()

    if not reference:
        return jsonify({'error': 'Référence manquante.'}), 400

    ticket = Ticket.query.filter_by(reference=reference).first()
    if not ticket:
        return jsonify({'error': 'Ticket introuvable.'}), 404

    if payment_status in ('completed', 'success', 'paid'):
        confirm_ticket_payment(ticket, f"JEKO-WEBHOOK-{ticket.reference}")
        return jsonify({'status': 'ok', 'message': 'Ticket validé avec succès.'}), 200
    else:
        ticket.payment_status = 'FAILED'
        db.session.commit()
        return jsonify({'status': 'ok', 'message': 'Statut échec enregistré.'}), 200
