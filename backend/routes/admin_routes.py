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
            return jsonify({'error': 'Jeton d\'authentification manquant.'}), 401

        try:
            payload = jwt.decode(token, current_app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
            current_user = AdminUser.query.get(payload['sub'])
            if not current_user:
                return jsonify({'error': 'Utilisateur non autorisé.'}), 401
        except Exception as e:
            return jsonify({'error': 'Session expirée ou jeton invalide.'}), 401

        return f(*args, **kwargs)
    return decorated

@admin_bp.route('/api/admin/login', methods=['POST'])
def admin_login():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()

    admin = AdminUser.query.filter_by(username=username).first()
    if not admin or not admin.check_password(password):
        return jsonify({'error': 'Identifiants incorrects.'}), 401

    payload = {
        'sub': admin.id,
        'username': admin.username,
        'role': admin.role,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }
    token = jwt.encode(payload, current_app.config['JWT_SECRET_KEY'], algorithm='HS256')

    return jsonify({
        'token': token,
        'user': {
            'username': admin.username,
            'role': admin.role
        }
    }), 200

@admin_bp.route('/api/admin/stats', methods=['GET'])
@admin_required
def get_stats():
    total_tickets = Ticket.query.filter_by(payment_status='SUCCESS').count()
    total_amount = db.session.query(db.func.sum(Ticket.total_amount)).filter_by(payment_status='SUCCESS').scalar() or 0
    checked_in_count = Ticket.query.filter_by(payment_status='SUCCESS', checked_in=True).count()
    
    pending_count = Ticket.query.filter_by(payment_status='PENDING').count()
    failed_count = Ticket.query.filter_by(payment_status='FAILED').count()

    # Operator breakdown
    operators = ['wave', 'mtn', 'orange', 'moov', 'kkiapay']
    operator_stats = {}
    for op in operators:
        count = Ticket.query.filter_by(payment_status='SUCCESS', payment_method=op).count()
        sum_op = db.session.query(db.func.sum(Ticket.total_amount)).filter_by(payment_status='SUCCESS', payment_method=op).scalar() or 0
        operator_stats[op] = {
            'count': count,
            'amount': int(sum_op)
        }

    return jsonify({
        'total_tickets_sold': total_tickets,
        'total_revenue': int(total_amount),
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
    return jsonify([t.to_dict() for t in tickets]), 200

@admin_bp.route('/api/admin/tickets/validate-qr', methods=['POST'])
@admin_required
def validate_qr():
    data = request.get_json() or {}
    code = data.get('code', '').strip()

    # Code may be reference (e.g. OYH-2026-X89A2) or URL (https://openyourheart-bethesda.ci/verify/OYH-2026-X89A2)
    reference = code
    if '/' in code:
        reference = code.split('/')[-1]

    ticket = Ticket.query.filter_by(reference=reference).first()
    if not ticket:
        return jsonify({'success': False, 'message': 'Billet invalide ou introuvable.'}), 404

    if ticket.payment_status != 'SUCCESS':
        return jsonify({
            'success': False,
            'message': f"Paiement non confirmé pour ce billet (Statut: {ticket.payment_status}).",
            'ticket': ticket.to_dict()
        }), 400

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
    
    si = io.StringIO()
    writer = csv.writer(si)
    writer.writerow(['Référence', 'Nom Prénoms', 'Téléphone', 'WhatsApp', 'Email', 'Quantité', 'Montant (FCFA)', 'Mode Paiement', 'Statut', 'Présent', 'Date Achat'])

    for t in tickets:
        writer.writerow([
            t.reference,
            t.buyer_name,
            t.buyer_phone,
            t.buyer_whatsapp,
            t.buyer_email,
            t.quantity,
            t.total_amount,
            t.payment_method,
            t.payment_status,
            'Oui' if t.checked_in else 'Non',
            t.created_at.strftime('%Y-%m-%d %H:%M:%S') if t.created_at else ''
        ])

    output = make_response(si.getvalue())
    output.headers["Content-Disposition"] = "attachment; filename=open_your_heart_tickets.csv"
    output.headers["Content-type"] = "text/csv; charset=utf-8"
    return output

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
