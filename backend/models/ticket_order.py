from datetime import datetime
from . import db

class TicketOrder(db.Model):
    __tablename__ = 'ticket_orders'

    id = db.Column(db.Integer, primary_key=True)
    order_reference = db.Column(db.String(100), unique=True, nullable=False) # e.g. ORD-20261225-XXXX
    buyer_name = db.Column(db.String(120), nullable=False)
    buyer_email = db.Column(db.String(120), nullable=False)
    buyer_phone = db.Column(db.String(50), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    unit_price = db.Column(db.Float, nullable=False, default=10000.0)
    total_amount = db.Column(db.Float, nullable=False, default=10000.0)
    payment_status = db.Column(db.String(30), nullable=False, default='PENDING') # PENDING, PAID, FAILED
    wave_transaction_id = db.Column(db.String(120), nullable=True)
    wave_checkout_url = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    paid_at = db.Column(db.DateTime, nullable=True)

    tickets = db.relationship('Ticket', backref='order', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'order_reference': self.order_reference,
            'buyer_name': self.buyer_name,
            'buyer_email': self.buyer_email,
            'buyer_phone': self.buyer_phone,
            'quantity': self.quantity,
            'unit_price': self.unit_price,
            'total_amount': self.total_amount,
            'payment_status': self.payment_status,
            'wave_transaction_id': self.wave_transaction_id,
            'wave_checkout_url': self.wave_checkout_url,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'paid_at': self.paid_at.isoformat() if self.paid_at else None,
            'tickets': [t.to_dict() for t in self.tickets]
        }
