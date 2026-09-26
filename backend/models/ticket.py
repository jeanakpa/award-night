from datetime import datetime
from . import db

class Ticket(db.Model):
    __tablename__ = 'tickets'

    id = db.Column(db.Integer, primary_key=True)
    ticket_code = db.Column(db.String(100), unique=True, nullable=False) # UUID or encrypted token
    order_id = db.Column(db.Integer, db.ForeignKey('ticket_orders.id'), nullable=False)
    attendee_name = db.Column(db.String(120), nullable=False)
    ticket_number = db.Column(db.Integer, nullable=False, default=1) # 1 of N in order
    qr_code_path = db.Column(db.Text, nullable=True)
    is_scanned = db.Column(db.Boolean, default=False)
    scanned_at = db.Column(db.DateTime, nullable=True)
    scanned_by_admin = db.Column(db.String(120), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'ticket_code': self.ticket_code,
            'order_id': self.order_id,
            'attendee_name': self.attendee_name,
            'ticket_number': self.ticket_number,
            'qr_code_path': self.qr_code_path,
            'is_scanned': self.is_scanned,
            'scanned_at': self.scanned_at.isoformat() if self.scanned_at else None,
            'scanned_by_admin': self.scanned_by_admin,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'buyer_name': self.order.buyer_name if self.order else None,
            'buyer_phone': self.order.buyer_phone if self.order else None,
            'payment_status': self.order.payment_status if self.order else None
        }
