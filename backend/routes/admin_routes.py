import jwt
import datetime
import csv
import io
from flask import Blueprint, request, jsonify, make_response, current_app
from models import db, Ticket, AdminUser, PaymentLog
from services.ticket_service import send_ticket_email, generate_qr_code_base64
from functools import wraps

admin_bp = Blueprint('admin', __name__)

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]

        if not token:
            token = request.args.get('token')

        if not token:
            return jsonify({'error': 'Jeton d\'authentification manquant.'}), 401

        try:
            payload = jwt.decode(token, current_app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
            user_id = int(payload['sub'])
            current_user = AdminUser.query.get(user_id)
            if not current_user:
                return jsonify({'error': 'Utilisateur non autorisé.'}), 401
        except Exception as e:
            print(f"[JWT DECODE ERROR] Token decoding failed: {e}")
            return jsonify({'error': f'Session expirée ou jeton invalide ({str(e)}).'}), 401

        return f(*args, **kwargs)
    return decorated

@admin_bp.route('/api/admin/login', methods=['POST'])
def admin_login():
    try:
        data = request.get_json() or {}
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()

        admin = AdminUser.query.filter_by(username=username).first()
        if not admin or not admin.check_password(password):
            return jsonify({'error': 'Identifiants incorrects.'}), 401

        payload = {
            'sub': str(admin.id),
            'username': admin.username,
            'role': admin.role,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=365) # Stay logged in until manual logout
        }
        token = jwt.encode(payload, current_app.config['JWT_SECRET_KEY'], algorithm='HS256')
        if isinstance(token, bytes):
            token = token.decode('utf-8')

        return jsonify({
            'token': token,
            'user': {
                'username': admin.username,
                'role': admin.role
            }
        }), 200
    except Exception as e:
        print(f"[ADMIN LOGIN ERROR] {e}")
        return jsonify({'error': f"Erreur lors de la connexion: {str(e)}"}), 500

@admin_bp.route('/api/admin/stats', methods=['GET'])
@admin_required
def get_stats():
    total_tickets = Ticket.query.count()
    success_tickets = Ticket.query.filter_by(payment_status='SUCCESS').all()
    total_revenue = sum(t.total_amount for t in success_tickets if t.total_amount)
    checked_in_count = Ticket.query.filter_by(checked_in=True).count()
    
    pending_count = Ticket.query.filter_by(payment_status='PENDING').count()
    failed_count = Ticket.query.filter_by(payment_status='FAILED').count()

    all_tickets = Ticket.query.all()
    operator_stats = {'wave': 0, 'mtn': 0, 'orange': 0, 'moov': 0, 'kkiapay': 0, 'other': 0}
    for t in all_tickets:
        pm = (t.payment_method or '').lower()
        if 'wave' in pm:
            operator_stats['wave'] += 1
        elif 'mtn' in pm:
            operator_stats['mtn'] += 1
        elif 'orange' in pm:
            operator_stats['orange'] += 1
        elif 'moov' in pm:
            operator_stats['moov'] += 1
        elif 'kkiapay' in pm:
            operator_stats['kkiapay'] += 1
        else:
            operator_stats['other'] += 1

    return jsonify({
        'total_tickets_sold': total_tickets,
        'total_revenue': int(total_revenue),
        'checked_in_count': checked_in_count,
        'pending_count': pending_count,
        'failed_count': failed_count,
        'operator_stats': operator_stats
    }), 200

@admin_bp.route('/api/admin/tickets', methods=['GET'])
@admin_required
def list_tickets():
    search = request.args.get('search', '').strip()
    status = request.args.get('status', '').strip()
    operator = request.args.get('operator', '').strip()
    checked_in = request.args.get('checked_in', '').strip()

    query = Ticket.query

    if search:
        query = query.filter(
            (Ticket.buyer_name.ilike(f"%{search}%")) |
            (Ticket.reference.ilike(f"%{search}%")) |
            (Ticket.buyer_phone.ilike(f"%{search}%")) |
            (Ticket.buyer_email.ilike(f"%{search}%"))
        )

    if status:
        query = query.filter(Ticket.payment_status == status)

    if operator:
        query = query.filter(Ticket.payment_method == operator)

    if checked_in.lower() == 'true':
        query = query.filter(Ticket.checked_in == True)
    elif checked_in.lower() == 'false':
        query = query.filter(Ticket.checked_in == False)

    tickets = query.order_by(Ticket.created_at.desc()).all()
    ticket_list = []
    has_changes = False
    for t in tickets:
        d = t.to_dict()
        if not d.get('qr_code_data'):
            verify_url = f"https://openyourheart-bethesda.ci/verify/{t.reference}"
            qr_base64 = generate_qr_code_base64(verify_url)
            d['qr_code_data'] = qr_base64
            t.qr_code_data = qr_base64
            has_changes = True
        ticket_list.append(d)

    if has_changes:
        db.session.commit()

    return jsonify(ticket_list), 200

@admin_bp.route('/api/admin/tickets/<int:ticket_id>/toggle-checkin', methods=['POST'])
@admin_required
def toggle_checkin(ticket_id):
    ticket = Ticket.query.get(ticket_id)
    if not ticket:
        return jsonify({'error': 'Billet non trouvé.'}), 404

    ticket.checked_in = not ticket.checked_in
    if ticket.checked_in:
        ticket.checked_in_at = datetime.datetime.utcnow()
    else:
        ticket.checked_in_at = None
    db.session.commit()

    return jsonify({
        'success': True,
        'message': f"Statut d'entrée mis à jour pour {ticket.buyer_name} ({'Présent' if ticket.checked_in else 'Non présent'}).",
        'ticket': ticket.to_dict()
    }), 200

@admin_bp.route('/api/admin/tickets/<int:ticket_id>/update-status', methods=['POST'])
@admin_required
def update_ticket_status(ticket_id):
    data = request.get_json() or {}
    new_status = data.get('status', 'SUCCESS').upper()

    ticket = Ticket.query.get(ticket_id)
    if not ticket:
        return jsonify({'error': 'Billet non trouvé.'}), 404

    ticket.payment_status = new_status
    if not ticket.qr_code_data:
        verify_url = f"https://openyourheart-bethesda.ci/verify/{ticket.reference}"
        ticket.qr_code_data = generate_qr_code_base64(verify_url)

    db.session.commit()

    return jsonify({
        'success': True,
        'message': f"Statut de paiement de {ticket.buyer_name} modifié en {new_status}.",
        'ticket': ticket.to_dict()
    }), 200

@admin_bp.route('/api/admin/tickets/validate-qr', methods=['POST'])
@admin_required
def validate_qr():
    data = request.get_json() or {}
    code = data.get('code', '').strip()

    # Extract reference using regex (handles ticket_ref=AWN-..., /verify/AWN-..., or raw AWN-...)
    import re
    reference = code
    match = re.search(r'(AWN-[A-Za-z0-9-]+|OYH-[A-Za-z0-9-]+)', code, re.IGNORECASE)
    if match:
        reference = match.group(1).upper()
    elif '/' in code:
        reference = code.split('/')[-1].split('?')[0].strip()

    ticket = Ticket.query.filter_by(reference=reference).first()
    if not ticket:
        ticket = Ticket.query.filter(Ticket.reference.ilike(f"%{reference}%")).first()

    if not ticket:
        return jsonify({'success': False, 'message': f'Billet ({reference}) introuvable dans la base.'}), 404

    # If payment status is PENDING, auto confirm to SUCCESS upon admin scanner verification
    if ticket.payment_status != 'SUCCESS':
        ticket.payment_status = 'SUCCESS'

    if ticket.checked_in:
        return jsonify({
            'success': False,
            'message': f"Billet DÉJÀ VALIDÉ à {ticket.checked_in_at.strftime('%H:%M:%S le %d/%m/%Y')}.",
            'already_checked_in': True,
            'ticket': ticket.to_dict()
        }), 400

    ticket.checked_in = True
    ticket.checked_in_at = datetime.datetime.utcnow()
    db.session.commit()

    return jsonify({
        'success': True,
        'message': f"Accès ACCORDÉ pour {ticket.buyer_name} !",
        'ticket': ticket.to_dict()
    }), 200

@admin_bp.route('/api/admin/tickets/<int:ticket_id>/resend-email', methods=['POST'])
@admin_required
def resend_email(ticket_id):
    ticket = Ticket.query.get(ticket_id)
    if not ticket:
        return jsonify({'error': 'Billet non trouvé.'}), 404

    if not ticket.qr_code_data:
        verify_url = f"https://openyourheart-bethesda.ci/verify/{ticket.reference}"
        ticket.qr_code_data = generate_qr_code_base64(verify_url)

    sent, msg = send_ticket_email(ticket.to_dict(), ticket.qr_code_data)
    if sent:
        ticket.email_sent = True
        db.session.commit()
        return jsonify({'message': 'Email renvoyé avec succès.'}), 200
    else:
        return jsonify({'error': f"Échec d'envoi: {msg}"}), 500

@admin_bp.route('/api/admin/tickets/export', methods=['GET'])
@admin_required
def export_csv():
    tickets = Ticket.query.order_by(Ticket.created_at.desc()).all()
    
    output_bytes = io.BytesIO()
    # UTF-8 BOM byte marker so Excel opens file as UTF-8 without mangling accents (Téléphone, Nom & Prénoms)
    output_bytes.write(b'\xef\xbb\xbf')
    
    text_buffer = io.StringIO()
    writer = csv.writer(text_buffer, delimiter=';')
    writer.writerow(['Référence', 'Nom & Prénoms', 'Téléphone', 'WhatsApp', 'Email', 'Quantité', 'Montant (FCFA)', 'Mode Paiement (Jèko)', 'Statut Paiement', 'Présent Gala', 'Date Achat'])

    for t in tickets:
        # Prepend single quote so Excel formats phone numbers as text and keeps leading 0 (ex: '0556936994)
        phone = f"'{t.buyer_phone}" if t.buyer_phone else ''
        wa = f"'{t.buyer_whatsapp}" if t.buyer_whatsapp else ''

        status_fr = 'Succès' if t.payment_status == 'SUCCESS' else ('En attente' if t.payment_status == 'PENDING' else 'Échoué')
        method_raw = t.payment_method or ''
        method_fr = method_raw.replace('jeko-', '').upper() + ' (Jèko)' if 'jeko' in method_raw.lower() else method_raw.upper()

        writer.writerow([
            t.reference,
            t.buyer_name,
            phone,
            wa,
            t.buyer_email,
            t.quantity,
            t.total_amount,
            method_fr,
            status_fr,
            'Oui' if t.checked_in else 'Non',
            t.created_at.strftime('%d/%m/%Y %H:%M') if t.created_at else ''
        ])

    output_bytes.write(text_buffer.getvalue().encode('utf-8'))
    output_bytes.seek(0)

    res = make_response(output_bytes.getvalue())
    res.headers["Content-Disposition"] = "attachment; filename=tickets_award_night_2026.csv"
    res.headers["Content-type"] = "text/csv; charset=utf-8"
    return res

@admin_bp.route('/api/admin/export-sql', methods=['GET'])
@admin_required
def export_sql():
    from export_db import generate_sql_dump
    from flask import send_file
    sql_path = generate_sql_dump("database_dump.sql")
    return send_file(
        sql_path,
        mimetype="application/sql",
        as_attachment=True,
        download_name="database_dump.sql"
    )
