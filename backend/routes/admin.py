from datetime import datetime
from flask import Blueprint, request, jsonify
from models import db, Admin, TicketOrder, Ticket, Category, Nominee, VoteTransaction, Setting
from routes.auth import admin_required

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

@admin_bp.route('/stats', methods=['GET'])
@admin_required
def get_dashboard_stats(current_admin):
    paid_orders = TicketOrder.query.filter_by(payment_status='PAID').all()
    tickets_sold_count = sum(o.quantity for o in paid_orders)
    total_ticket_revenue = sum(o.total_amount for o in paid_orders)
    
    total_tickets_created = Ticket.query.count()
    scanned_tickets_count = Ticket.query.filter_by(is_scanned=True).count()
    checkin_rate = round((scanned_tickets_count / tickets_sold_count * 100), 1) if tickets_sold_count > 0 else 0

    paid_votes = VoteTransaction.query.filter_by(payment_status='PAID').all()
    total_votes_cast = sum(v.vote_count for v in paid_votes)
    total_vote_revenue = sum(v.total_amount for v in paid_votes)

    total_categories = Category.query.count()
    total_approved_nominees = Nominee.query.filter_by(status='APPROVED').count()
    pending_registrations_count = Nominee.query.filter_by(status='PENDING').count()

    grand_total_revenue = total_ticket_revenue + total_vote_revenue
    deadline_str = Setting.get('self_registration_deadline')

    return jsonify({
        'grand_total_revenue': grand_total_revenue,
        'ticket_revenue': total_ticket_revenue,
        'tickets_sold': tickets_sold_count,
        'tickets_scanned': scanned_tickets_count,
        'checkin_rate': checkin_rate,
        'vote_revenue': total_vote_revenue,
        'total_votes_cast': total_votes_cast,
        'total_categories': total_categories,
        'total_approved_nominees': total_approved_nominees,
        'pending_registrations_count': pending_registrations_count,
        'self_registration_deadline': deadline_str
    })

@admin_bp.route('/nominees/pending', methods=['GET'])
@admin_required
def get_pending_nominees(current_admin):
    pending_list = Nominee.query.filter_by(status='PENDING').order_by(Nominee.id.desc()).all()
    return jsonify({
        'pending_nominees': [n.to_dict() for n in pending_list]
    })

@admin_bp.route('/nominees/<int:nominee_id>/status', methods=['POST'])
@admin_required
def update_nominee_status(current_admin, nominee_id):
    data = request.get_json() or {}
    status = data.get('status')

    if status not in ['APPROVED', 'REJECTED']:
        return jsonify({'message': 'Statut invalide. Choisissez APPROVED ou REJECTED.'}), 400

    nominee = Nominee.query.get(nominee_id)
    if not nominee:
        return jsonify({'message': 'Nominé introuvable'}), 404

    nominee.status = status
    db.session.commit()

    return jsonify({
        'message': f"Statut du nominé mis à jour en '{status}'",
        'nominee': nominee.to_dict()
    })

@admin_bp.route('/categories', methods=['GET', 'POST'])
@admin_required
def handle_categories(current_admin):
    if request.method == 'GET':
        categories = Category.query.all()
        return jsonify({
            'categories': [c.to_dict(include_nominees=True) for c in categories]
        })

    data = request.get_json() or {}
    title = data.get('title') or data.get('name')
    description = data.get('description', '')
    icon_name = data.get('icon_name', 'Award')
    allow_self = data.get('allow_self_registration', True)

    if not title:
        return jsonify({'message': 'Le titre de la catégorie est obligatoire'}), 400

    category = Category(
        title=title.strip(),
        description=description.strip(),
        icon_name=icon_name,
        allow_self_registration=allow_self
    )
    db.session.add(category)
    db.session.commit()

    return jsonify({
        'message': 'Catégorie créée avec succès',
        'category': category.to_dict()
    }), 201

@admin_bp.route('/orders', methods=['GET'])
@admin_required
def list_orders(current_admin):
    status = request.args.get('status')
    query = TicketOrder.query
    if status:
        query = query.filter_by(payment_status=status.upper())
    orders = query.order_by(TicketOrder.id.desc()).all()
    return jsonify({
        'orders': [o.to_dict() for o in orders]
    })

@admin_bp.route('/admins', methods=['GET'])
@admin_required
def list_admins(current_admin):
    admins = Admin.query.all()
    return jsonify({
        'admins': [a.to_dict() for a in admins]
    })

@admin_bp.route('/ticket-types', methods=['GET', 'POST'])
@admin_required
def list_ticket_types(current_admin):
    data = request.get_json() or {}
    name = data.get('name', 'Ticket Gala Unique')
    price = float(data.get('price', 10000.0))
    return jsonify({
        'message': 'Type de ticket enregistré',
        'ticket_type': {
            'id': 1,
            'name': name,
            'price': price,
            'currency': 'FCFA',
            'description': 'Entrée officielle Dîner Gala & Cérémonie'
        },
        'ticket_types': [
            {
                'id': 1,
                'name': name,
                'price': price,
                'currency': 'FCFA',
                'description': 'Entrée officielle Dîner Gala & Cérémonie'
            }
        ]
    })

@admin_bp.route('/scan', methods=['POST'])
@admin_required
def admin_scan_alias(current_admin):
    from routes.tickets import scan_ticket
    return scan_ticket(current_admin)

@admin_bp.route('/nominees', methods=['POST'])
@admin_required
def add_nominee_by_admin(current_admin):
    data = request.get_json() or {}
    category_id = data.get('category_id')
    name = data.get('name')
    bio = data.get('bio', '')
    photo_url = data.get('photo_url') or 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'

    if not category_id or not name:
        return jsonify({'message': 'La catégorie et le nom complet sont requis'}), 400

    category = Category.query.get(category_id)
    if not category:
        return jsonify({'message': 'Catégorie introuvable'}), 404

    nominee = Nominee(
        category_id=category_id,
        name=name.strip(),
        bio=bio.strip(),
        photo_url=photo_url,
        registration_type='ADMIN',
        status='APPROVED',
        vote_count=0
    )
    db.session.add(nominee)
    db.session.commit()

    return jsonify({
        'message': 'Nominé ajouté avec succès',
        'nominee': nominee.to_dict()
    }), 201

@admin_bp.route('/settings', methods=['PUT'])
@admin_required
def update_settings(current_admin):
    data = request.get_json() or {}
    
    if 'self_registration_deadline' in data:
        Setting.set('self_registration_deadline', data['self_registration_deadline'])
    if 'auto_approve_registrations' in data:
        Setting.set('auto_approve_registrations', str(data['auto_approve_registrations']))

    return jsonify({
        'message': 'Paramètres mis à jour avec succès'
    })
