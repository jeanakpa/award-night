import requests
import json
from flask import current_app
from models import db, PaymentLog, Ticket
from services.ticket_service import generate_qr_code_base64, send_ticket_email, send_whatsapp_notification

def process_simulated_payment(ticket, operator, simulated_status, transaction_id=None):
    """Processes simulated test payment for Jeko, Wave, MTN, Orange, or Moov."""
    operator_name = operator.lower() if operator else 'jeko'
    tx_ref = transaction_id or f"TXN-SIM-{operator_name.upper()}-{ticket.reference}"

    raw_log = json.dumps({
        'operator': operator_name,
        'simulated_status': simulated_status,
        'transaction_ref': tx_ref,
        'amount': ticket.total_amount
    })

    log_entry = PaymentLog(
        ticket_id=ticket.id,
        operator=operator_name,
        status=simulated_status,
        raw_payload=raw_log
    )
    db.session.add(log_entry)

    if simulated_status == 'SUCCESS':
        ticket.payment_status = 'SUCCESS'
        ticket.payment_method = operator_name
        ticket.transaction_ref = tx_ref
        
        # Generate QR Code & payload link
        verify_url = f"https://{current_app.config.get('DOMAIN_URL')}/verify/{ticket.reference}"
        ticket.qr_code_data = generate_qr_code_base64(verify_url)
        db.session.commit()

        # Dispatch email & WhatsApp notification
        ticket_dict = ticket.to_dict()
        email_sent, msg = send_ticket_email(ticket_dict, ticket.qr_code_data)
        if email_sent:
            ticket.email_sent = True
        
        send_whatsapp_notification(ticket_dict, sender_number="+2250708729293")
        db.session.commit()

        return {
            'success': True,
            'message': 'Paiement effectué avec succès !',
            'ticket': ticket.to_dict()
        }
    else:
        ticket.payment_status = 'FAILED'
        ticket.payment_method = operator_name
        ticket.transaction_ref = tx_ref
        db.session.commit()

        return {
            'success': False,
            'message': 'Paiement échoué. Veuillez vérifier vos informations ou réessayer.',
            'ticket': ticket.to_dict()
        }

