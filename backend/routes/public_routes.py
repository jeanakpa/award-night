from flask import Blueprint, request, jsonify, send_file, current_app
from models import db, Ticket
from services.ticket_service import generate_ticket_reference, generate_qr_code_base64, create_pdf_ticket
from services.payment_service import process_simulated_payment
import io

public_bp = Blueprint('public', __name__)

@public_bp.route('/api/tickets/purchase', methods=['POST'])
def purchase_ticket():
    try:
        data = request.get_json() or {}
        buyer_name = data.get('buyer_name', '').strip()
        buyer_phone = data.get('buyer_phone', '').strip()
        buyer_whatsapp = data.get('buyer_whatsapp', '').strip()
        buyer_email = data.get('buyer_email', '').strip()
        quantity = int(data.get('quantity', 1))

        if not buyer_name or not buyer_phone or not buyer_email:
            return jsonify({'error': 'Le nom, le téléphone et l\'email sont requis.'}), 400

        unit_price = 10
        total_amount = unit_price * quantity
        reference = generate_ticket_reference()

        ticket = Ticket(
            reference=reference,
            buyer_name=buyer_name,
            buyer_phone=buyer_phone,
            buyer_whatsapp=buyer_whatsapp or buyer_phone,
            buyer_email=buyer_email,
            quantity=quantity,
            unit_price=unit_price,
            total_amount=total_amount,
            payment_status='PENDING'
        )

        try:
            db.session.add(ticket)
            db.session.commit()
        except Exception as dberr:
            db.session.rollback()
            try:
                db.create_all()
                db.session.add(ticket)
                db.session.commit()
            except Exception as dberr2:
                db.session.rollback()
                print(f"[PURCHASE DB ERROR] {dberr2}")
                return jsonify({'error': f'Erreur enregistrement base de données: {str(dberr2)}'}), 500

        return jsonify({
            'message': 'Commande de billet enregistrée. Veuillez procéder au paiement.',
            'ticket': ticket.to_dict()
        }), 201
    except Exception as general_err:
        print(f"[PURCHASE GENERAL ERROR] {general_err}")
        return jsonify({'error': f'Erreur serveur: {str(general_err)}'}), 500

@public_bp.route('/api/payments/process-simulated', methods=['POST'])
def process_simulated():
    data = request.get_json() or {}
    reference = data.get('reference')
    operator = data.get('operator', 'jeko')
    status = data.get('status', 'SUCCESS')

    if not reference:
        return jsonify({'error': 'Référence du billet requise.'}), 400

    ticket = Ticket.query.filter_by(reference=reference).first()
    if not ticket:
        return jsonify({'error': 'Billet non trouvé.'}), 404

    res = process_simulated_payment(ticket, operator, status)
    return jsonify(res), 200 if res['success'] else 400

@public_bp.route('/api/tickets/lookup/<reference>', methods=['GET'])
def lookup_ticket(reference):
    ticket = Ticket.query.filter_by(reference=reference).first()
    if not ticket:
        return jsonify({'success': False, 'message': 'Ticket introuvable.'}), 404

    if ticket.payment_status == 'PENDING':
        from services.jeko_service import confirm_ticket_payment
        confirm_ticket_payment(ticket, f"JEKO-RETURN-{ticket.reference}")

    return jsonify({
        'success': True,
        'ticket': ticket.to_dict()
    }), 200

@public_bp.route('/api/tickets/verify/<reference>', methods=['GET'])
def verify_ticket(reference):
    ticket = Ticket.query.filter_by(reference=reference).first()
    if not ticket:
        return jsonify({'valid': False, 'message': 'Ticket introuvable ou invalide.'}), 404

    return jsonify({
        'valid': True,
        'ticket': ticket.to_dict()
    }), 200

@public_bp.route('/api/tickets/<reference>/pdf', methods=['GET'])
def download_ticket_pdf(reference):
    ticket = Ticket.query.filter_by(reference=reference).first()
    if not ticket:
        return jsonify({'error': 'Ticket non trouvé.'}), 404

    if not ticket.qr_code_data:
        verify_url = f"https://openyourheart-bethesda.ci/verify/{ticket.reference}"
        ticket.qr_code_data = generate_qr_code_base64(verify_url)

    pdf_bytes = create_pdf_ticket(ticket.to_dict(), ticket.qr_code_data)
    return send_file(
        io.BytesIO(pdf_bytes),
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f"Ticket_{ticket.reference}.pdf"
    )
