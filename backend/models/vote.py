from datetime import datetime
from . import db

class VoteTransaction(db.Model):
    __tablename__ = 'vote_transactions'

    id = db.Column(db.Integer, primary_key=True)
    transaction_reference = db.Column(db.String(100), unique=True, nullable=False) # VOTE-20261225-XXXX
    nominee_id = db.Column(db.Integer, db.ForeignKey('nominees.id'), nullable=False)
    voter_name = db.Column(db.String(120), nullable=True, default='Anonyme')
    voter_phone = db.Column(db.String(50), nullable=True)
    vote_count = db.Column(db.Integer, nullable=False, default=1)
    unit_price = db.Column(db.Float, nullable=False, default=25.0)
    total_amount = db.Column(db.Float, nullable=False, default=25.0)
    payment_status = db.Column(db.String(30), nullable=False, default='PENDING') # PENDING, PAID, FAILED
    wave_transaction_id = db.Column(db.String(120), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    paid_at = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'transaction_reference': self.transaction_reference,
            'nominee_id': self.nominee_id,
            'nominee_name': self.nominee.name if self.nominee else None,
            'category_title': self.nominee.category.title if self.nominee and self.nominee.category else None,
            'voter_name': self.voter_name,
            'voter_phone': self.voter_phone,
            'vote_count': self.vote_count,
            'unit_price': self.unit_price,
            'total_amount': self.total_amount,
            'payment_status': self.payment_status,
            'wave_transaction_id': self.wave_transaction_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'paid_at': self.paid_at.isoformat() if self.paid_at else None
        }
