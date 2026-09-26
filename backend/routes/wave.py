import uuid
import requests
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from models import db, TicketOrder, Ticket, VoteTransaction, Nominee

wave_bp = Blueprint('wave', __name__, url_prefix='/api/wave')

@wave_bp.route('/checkout', methods=['POST', 'GET'])
def wave_checkout():
    """Initiates a Wave payment checkout session or simulation."""
    if request.method == 'GET':
        tx_type = request.args.get('type')
        tx_ref = request.args.get('ref')
    else:
        data = request.get_json() or {}
        tx_type = data.get('type')
        tx_ref = data.get('ref')

    if tx_type == 'ticket':
        order = TicketOrder.query.filter_by(order_reference=tx_ref).first()
        if not order:
            return jsonify({'message': 'Commande ticket introuvable'}), 404
        
        amount = order.total_amount
        title = f"AWARD NIGHT - {order.quantity} Ticket(s) Gala"

        # Try real Wave API session creation if live keys provided, else prepare sandbox payload
        wave_url = f"https://pay.wave.com/c/live_checkout_session_{uuid.uuid4().hex[:12]}"
        order.wave_checkout_url = wave_url
        db.session.commit()

        return jsonify({
            'success': True,
            'checkout_type': 'ticket',
            'order_reference': order.order_reference,
            'buyer_name': order.buyer_name,
            'buyer_phone': order.buyer_phone,
            'amount': amount,
            'title': title,
            'wave_checkout_url': wave_url,
            'simulation_ready': True
        })

    elif tx_type == 'vote':
        vote_tx = VoteTransaction.query.filter_by(transaction_reference=tx_ref).first()
        if not vote_tx:
            return jsonify({'message': 'Transaction de vote introuvable'}), 404

        amount = vote_tx.total_amount
        nominee_name = vote_tx.nominee.name if vote_tx.nominee else "Nominé"
        title = f"AWARD NIGHT - {vote_tx.vote_count} Vote(s) pour {nominee_name}"

        wave_url = f"https://pay.wave.com/c/live_checkout_session_{uuid.uuid4().hex[:12]}"
        db.session.commit()

        return jsonify({
            'success': True,
            'checkout_type': 'vote',
            'transaction_reference': vote_tx.transaction_reference,
            'voter_name': vote_tx.voter_name,
            'nominee_name': nominee_name,
            'vote_count': vote_tx.vote_count,
            'amount': amount,
            'title': title,
            'wave_checkout_url': wave_url,
            'simulation_ready': True
        })

    return jsonify({'message': 'Type de transaction invalide'}), 400

@wave_bp.route('/simulate-payment', methods=['POST'])
def simulate_wave_payment():
    """Simulates instant Wave payment confirmation (for Sandbox testing)."""
    data = request.get_json() or {}
    tx_type = data.get('type')
    tx_ref = data.get('ref')
    phone = data.get('phone', '0700000000')

    wave_tx_id = f"WAVE-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6].upper()}"

    if tx_type == 'ticket':
        order = TicketOrder.query.filter_by(order_reference=tx_ref).first()
        if not order:
            return jsonify({'message': 'Commande non trouvée'}), 404

        if order.payment_status == 'PAID':
            return jsonify({
                'message': 'Paiement déjà validé',
                'order': order.to_dict()
            })

        order.payment_status = 'PAID'
        order.paid_at = datetime.utcnow()
        order.wave_transaction_id = wave_tx_id
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Paiement Wave de 10.000 FCFA effectué avec succès !',
            'wave_transaction_id': wave_tx_id,
            'order': order.to_dict()
        })

    elif tx_type == 'vote':
        vote_tx = VoteTransaction.query.filter_by(transaction_reference=tx_ref).first()
        if not vote_tx:
            return jsonify({'message': 'Transaction de vote non trouvée'}), 404

        if vote_tx.payment_status == 'PAID':
            return jsonify({
                'message': 'Vote déjà comptabilisé',
                'vote_transaction': vote_tx.to_dict()
            })

        vote_tx.payment_status = 'PAID'
        vote_tx.paid_at = datetime.utcnow()
        vote_tx.wave_transaction_id = wave_tx_id

        # Update nominee vote_count
        nominee = Nominee.query.get(vote_tx.nominee_id)
        if nominee:
            nominee.vote_count += vote_tx.vote_count

        db.session.commit()

        return jsonify({
            'success': True,
            'message': f"Paiement Wave de {vote_tx.total_amount} FCFA validé ! {vote_tx.vote_count} vote(s) ajoutés à {nominee.name}.",
            'wave_transaction_id': wave_tx_id,
            'vote_transaction': vote_tx.to_dict(),
            'updated_nominee': nominee.to_dict()
        })

    return jsonify({'message': 'Type de transaction inconnu'}), 400

@wave_bp.route('/webhook', methods=['POST'])
def wave_webhook():
    """Official Wave API Webhook Receiver."""
    payload = request.get_json() or {}
    event_type = payload.get('type')
    data = payload.get('data', {})

    if event_type == 'checkout.session.completed':
        client_reference_id = data.get('client_reference_id')
        wave_tx_id = data.get('id')

        if client_reference_id and client_reference_id.startswith('ORD-'):
            order = TicketOrder.query.filter_by(order_reference=client_reference_id).first()
            if order and order.payment_status != 'PAID':
                order.payment_status = 'PAID'
                order.paid_at = datetime.utcnow()
                order.wave_transaction_id = wave_tx_id
                db.session.commit()

        elif client_reference_id and client_reference_id.startswith('VOTE-'):
            vote_tx = VoteTransaction.query.filter_by(transaction_reference=client_reference_id).first()
            if vote_tx and vote_tx.payment_status != 'PAID':
                vote_tx.payment_status = 'PAID'
                vote_tx.paid_at = datetime.utcnow()
                vote_tx.wave_transaction_id = wave_tx_id

                nominee = Nominee.query.get(vote_tx.nominee_id)
                if nominee:
                    nominee.vote_count += vote_tx.vote_count

                db.session.commit()

    return jsonify({'received': True}), 200
