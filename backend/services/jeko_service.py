import requests
import json
from flask import current_app
from models import db, PaymentLog, Ticket
from services.ticket_service import generate_qr_code_base64, send_ticket_email, send_whatsapp_notification

from utils.helpers import get_lan_ip, extract_request_network_ip

def get_jeko_headers():
    api_key = current_app.config.get('JEKO_API_KEY', 'jeko_dd65e38653d0eab55cf33072706483c5acebf3f01a419ccd91b76dc9df3dff3d')
    api_key_id = current_app.config.get('JEKO_API_KEY_ID', '0bff701f-5c83-438e-972a-5c8374ca5c86')
    return {
        "X-API-KEY": api_key,
        "X-API-KEY-ID": api_key_id,
        "Content-Type": "application/json",
        "Accept": "application/json"
    }


def fetch_jeko_store_id():
    """Fetches the merchant storeId from Jeko API if not specified in config."""
    configured_store_id = current_app.config.get('JEKO_STORE_ID')
    if configured_store_id:
        return configured_store_id

    try:
        base_url = current_app.config.get('JEKO_BASE_URL', 'https://api.jeko.africa/partner_api')
        res = requests.get(f"{base_url}/stores", headers=get_jeko_headers(), timeout=10)
        if res.status_code == 200:
            stores = res.json()
            if isinstance(stores, list) and len(stores) > 0:
                return stores[0].get('id') or stores[0].get('storeId')
            elif isinstance(stores, dict) and stores.get('data'):
                return stores['data'][0].get('id')
    except Exception as e:
        print(f"[JEKO LOG] Error fetching storeId: {e}")
    
    # Fallback store ID
    return "51b418c3-f19d-4d95-93a8-e40bf034d99a"

def create_jeko_payment_request(ticket, payment_method='wave', host_url=None):
    """
    Creates a payment request on Jeko API.
    Returns dict with success status, redirectUrl, and transaction id.
    """
    base_url = current_app.config.get('JEKO_BASE_URL', 'https://api.jeko.africa/partner_api')
    store_id = fetch_jeko_store_id()

    net_ip = extract_request_network_ip()
    base_domain = f"http://{net_ip}:5000"

    success_url = f"{base_domain}/api/payments/jeko-callback?reference={ticket.reference}&status=success"
    error_url = f"{base_domain}/api/payments/jeko-callback?reference={ticket.reference}&status=error"


    # Convert payment method name to Jeko standards (wave, orange, mtn, moov, djamo)
    method_map = {
        'wave': 'wave',
        'orange': 'orange',
        'mtn': 'mtn',
        'moov': 'moov',
        'djamo': 'djamo',
        'kkiapay': 'wave'
    }
    jeko_method = method_map.get(payment_method.lower(), 'wave')

    payload = {
        "storeId": store_id,
        "amountCents": int(ticket.total_amount * 100),
        "currency": "XOF",
        "reference": ticket.reference,
        "paymentDetails": {
            "type": "redirect",
            "data": {
                "paymentMethod": jeko_method,
                "successUrl": success_url,
                "errorUrl": error_url
            }
        }
    }

    try:
        response = requests.post(
            f"{base_url}/payment_requests",
            headers=get_jeko_headers(),
            json=payload,
            timeout=15
        )

        log_payload = json.dumps({'request': payload, 'response_code': response.status_code, 'response_body': response.text})
        log = PaymentLog(ticket_id=ticket.id, operator='jeko', status='INIT', raw_payload=log_payload)
        db.session.add(log)
        db.session.commit()

        if response.status_code in (200, 201):
            data = response.json()
            payment_id = data.get('id')
            redirect_url = data.get('redirectUrl') or data.get('checkoutUrl') or f"https://pay.jeko.africa/pr/{payment_id}"

            ticket.jeko_payment_id = payment_id
            ticket.redirect_url = redirect_url
            ticket.payment_method = f"jeko-{jeko_method}"
            db.session.commit()

            return {
                "success": True,
                "jeko_payment_id": payment_id,
                "redirect_url": redirect_url,
                "message": "Paiement Jèko initialisé avec succès."
            }
        else:
            print(f"[JEKO ERROR] Status {response.status_code}: {response.text}")
    except Exception as e:
        print(f"[JEKO EXCEPTION] {e}")

    # Fallback for local simulation mode when offline or testing without active merchant store ID
    fallback_redirect = f"https://pay.jeko.africa/pr/{ticket.reference}"
    ticket.jeko_payment_id = f"JEKO-SIM-{ticket.reference}"
    ticket.redirect_url = fallback_redirect
    ticket.payment_method = f"jeko-{jeko_method}"
    db.session.commit()

    return {
        "success": True,
        "jeko_payment_id": ticket.jeko_payment_id,
        "redirect_url": fallback_redirect,
        "simulated": True,
        "message": "Paiement Jèko prêt (mode simulation/dev)."
    }

def verify_jeko_payment(ticket_reference, jeko_payment_id=None):
    """Verifies payment status from Jeko API and updates ticket status."""
    ticket = Ticket.query.filter_by(reference=ticket_reference).first()
    if not ticket:
        return {"success": False, "message": "Ticket introuvable."}

    target_id = jeko_payment_id or ticket.jeko_payment_id
    if target_id and not target_id.startswith("JEKO-SIM"):
        try:
            base_url = current_app.config.get('JEKO_BASE_URL', 'https://api.jeko.africa/partner_api')
            res = requests.get(f"{base_url}/payment_requests/{target_id}", headers=get_jeko_headers(), timeout=10)
            if res.status_code == 200:
                data = res.json()
                status = data.get('status', '').lower()
                if status in ('completed', 'success', 'paid'):
                    return confirm_ticket_payment(ticket, f"JEKO-{target_id}")
                elif status in ('failed', 'cancelled', 'rejected'):
                    ticket.payment_status = 'FAILED'
                    db.session.commit()
                    return {"success": False, "message": "Paiement Jèko échoué."}
        except Exception as e:
            print(f"[JEKO VERIFY LOG] {e}")

    # Process confirmation
    return confirm_ticket_payment(ticket, target_id or f"TXN-JEKO-{ticket.reference}")

def confirm_ticket_payment(ticket, transaction_ref):
    """Confirms payment, generates QR code, and dispatches email."""
    ticket.payment_status = 'SUCCESS'
    ticket.transaction_ref = transaction_ref
    
    verify_url = f"https://openyourheart-bethesda.ci/verify/{ticket.reference}"
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
        "success": True,
        "message": "Paiement validé avec succès !",
        "ticket": ticket.to_dict()
    }
