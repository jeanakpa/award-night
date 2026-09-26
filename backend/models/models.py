from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import werkzeug.security as security

db = SQLAlchemy()

class Ticket(db.Model):
    __tablename__ = 'tickets'

    id = db.Column(db.Integer, primary_key=True)
    reference = db.Column(db.String(32), unique=True, nullable=False, index=True)
    buyer_name = db.Column(db.String(120), nullable=False)
    buyer_phone = db.Column(db.String(30), nullable=False)
    buyer_whatsapp = db.Column(db.String(30), nullable=False)
    buyer_email = db.Column(db.String(120), nullable=False)
    ticket_type = db.Column(db.String(50), default='Standard')
    quantity = db.Column(db.Integer, default=1)
    unit_price = db.Column(db.Integer, default=10)
    total_amount = db.Column(db.Integer, default=10)

    payment_method = db.Column(db.String(50), default='jeko')  # jeko, wave, mtn, orange, moov, kkiapay
    payment_status = db.Column(db.String(30), default='PENDING')  # PENDING, SUCCESS, FAILED
    transaction_ref = db.Column(db.String(100), nullable=True)
    jeko_payment_id = db.Column(db.String(100), nullable=True)
    redirect_url = db.Column(db.Text, nullable=True)
    qr_code_data = db.Column(db.Text, nullable=True)
    checked_in = db.Column(db.Boolean, default=False)
    checked_in_at = db.Column(db.DateTime, nullable=True)
    email_sent = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'reference': self.reference,
            'buyer_name': self.buyer_name,
            'buyer_phone': self.buyer_phone,
            'buyer_whatsapp': self.buyer_whatsapp,
            'buyer_email': self.buyer_email,
            'ticket_type': self.ticket_type,
            'quantity': self.quantity,
            'unit_price': self.unit_price,
            'total_amount': self.total_amount,
            'payment_method': self.payment_method,
            'payment_status': self.payment_status,
            'transaction_ref': self.transaction_ref,
            'jeko_payment_id': self.jeko_payment_id,
            'redirect_url': self.redirect_url,
            'qr_code_data': self.qr_code_data,
            'checked_in': self.checked_in,
            'checked_in_at': self.checked_in_at.isoformat() if self.checked_in_at else None,
            'email_sent': self.email_sent,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class AdminUser(db.Model):
    __tablename__ = 'admin_users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(60), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(30), default='admin')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = security.generate_password_hash(password)

    def check_password(self, password):
        return security.check_password_hash(self.password_hash, password)

class PaymentLog(db.Model):
    __tablename__ = 'payment_logs'

    id = db.Column(db.Integer, primary_key=True)
    ticket_id = db.Column(db.Integer, db.ForeignKey('tickets.id'), nullable=True)
    operator = db.Column(db.String(50))
    status = db.Column(db.String(30))
    raw_payload = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
