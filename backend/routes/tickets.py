import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from models import db, TicketOrder, Ticket
from utils.qr_generator import generate_qr_base64
from routes.auth import admin_required

tickets_bp = Blueprint('tickets', __name__, url_prefix='/api/tickets')

@tickets_bp.route('/order', methods=['POST'])
def create_ticket_order():
    data = request.get_json() or {}
    buyer_name = data.get('buyer_name')
    buyer_email = data.get('buyer_email')
    buyer_phone = data.get('buyer_phone')
    attendees = data.get('attendees', []) # Array of attendee full names e.g. ["Jean Kouassi", "Marie Yapo"]

    if not buyer_name or not buyer_phone or not attendees or not isinstance(attendees, list) or len(attendees) == 0:
        return jsonify({'message': 'Veuillez remplir toutes les informations acheteur et au moins un participant.'}), 400

    quantity = len(attendees)
    unit_price = current_app.config['TICKET_PRICE']
    total_amount = quantity * unit_price
    order_ref = f"ORD-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6].upper()}"

    order = TicketOrder(
        order_reference=order_ref,
        buyer_name=buyer_name,
        buyer_email=buyer_email or f"{buyer_phone}@awardnight.ci",
        buyer_phone=buyer_phone,
        quantity=quantity,
        unit_price=unit_price,
        total_amount=total_amount,
        payment_status='PENDING'
    )
    db.session.add(order)
    db.session.flush()

    tickets_created = []
    for idx, attendee_name in enumerate(attendees, start=1):
        clean_name = str(attendee_name).strip() or f"Participant {idx}"
        ticket_code = f"AN2026-{uuid.uuid4().hex[:12].upper()}"
        
        # QR Code payload stores code & ticket verification info
        qr_data = ticket_code
        qr_base64 = generate_qr_base64(qr_data)

        ticket = Ticket(
            ticket_code=ticket_code,
            order_id=order.id,
            attendee_name=clean_name,
            ticket_number=idx,
            qr_code_path=qr_base64,
            is_scanned=False
        )
        db.session.add(ticket)
        tickets_created.append(ticket)

    db.session.commit()

    return jsonify({
        'message': 'Commande créée avec succès',
        'order': order.to_dict(),
        'wave_launch_url': f"/api/wave/checkout?type=ticket&ref={order.order_reference}"
    }), 201

@tickets_bp.route('/order/<order_ref>', methods=['GET'])
def get_ticket_order(order_ref):
    order = TicketOrder.query.filter_by(order_reference=order_ref).first()
    if not order:
        return jsonify({'message': 'Commande introuvable'}), 404
    return jsonify({'order': order.to_dict()})

@tickets_bp.route('/verify/<ticket_code>', methods=['GET'])
def verify_ticket(ticket_code):
    ticket = Ticket.query.filter_by(ticket_code=ticket_code).first()
    if not ticket:
        return jsonify({
            'status': 'INVALID',
            'message': 'C\'est un faux ! Ce QR Code / ticket n\'existe pas dans notre base de données.',
            'valid': False
        }), 404

    order = ticket.order
    if order.payment_status != 'PAID':
        return jsonify({
            'status': 'UNPAID',
            'message': 'Ce ticket n\'a pas encore été réglé.',
            'valid': False,
            'ticket': ticket.to_dict()
        }), 400

    if ticket.is_scanned:
        return jsonify({
            'status': 'ALREADY_SCANNED',
            'message': f"C'est déjà scanné ! Ce ticket a déjà été validé le {ticket.scanned_at.strftime('%d/%m/%Y à %H:%M:%S')}.",
            'valid': False,
            'ticket': ticket.to_dict()
        })

    return jsonify({
        'status': 'VALID',
        'message': 'C\'est bon ! Ticket valide pour l\'AWARD NIGHT.',
        'valid': True,
        'ticket': ticket.to_dict()
    })

@tickets_bp.route('/scan', methods=['POST'])
@admin_required
def scan_ticket(current_admin):
    data = request.get_json() or {}
    ticket_code = data.get('ticket_code')

    if not ticket_code:
        return jsonify({'status': 'INVALID', 'message': 'Code ticket manquant', 'valid': False}), 400

    # Clean code if raw QR string passed
    ticket_code = ticket_code.strip()

    ticket = Ticket.query.filter_by(ticket_code=ticket_code).first()
    if not ticket:
        return jsonify({
            'status': 'INVALID',
            'message': 'C\'est un faux ! Ticket non reconnu.',
            'valid': False
        }), 404

    order = ticket.order
    if order.payment_status != 'PAID':
        return jsonify({
            'status': 'UNPAID',
            'message': 'Paiement non confirmé pour ce ticket.',
            'valid': False,
            'ticket': ticket.to_dict()
        }), 400

    if ticket.is_scanned:
        return jsonify({
            'status': 'ALREADY_SCANNED',
            'message': f"Attention : C'est déjà scanné le {ticket.scanned_at.strftime('%d/%m/%Y à %H:%M')}",
            'valid': False,
            'ticket': ticket.to_dict()
        })

    # Validate ticket scan
    ticket.is_scanned = True
    ticket.scanned_at = datetime.utcnow()
    ticket.scanned_by_admin = current_admin.username
    db.session.commit()

    return jsonify({
        'status': 'VALID',
        'message': 'C\'est bon ! Ticket validé avec succès.',
        'valid': True,
        'ticket': ticket.to_dict()
    })

@tickets_bp.route('/list', methods=['GET'])
@admin_required
def list_all_tickets(current_admin):
    tickets = Ticket.query.order_by(Ticket.id.desc()).all()
    return jsonify({
        'tickets': [t.to_dict() for t in tickets]
    })
