from datetime import datetime
from . import db

class Nominee(db.Model):
    __tablename__ = 'nominees'

    id = db.Column(db.Integer, primary_key=True)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    bio = db.Column(db.Text, nullable=True)
    photo_url = db.Column(db.Text, nullable=True)
    phone = db.Column(db.String(50), nullable=True)
    email = db.Column(db.String(120), nullable=True)
    registration_type = db.Column(db.String(30), default='ADMIN') # 'ADMIN' or 'SELF'
    status = db.Column(db.String(30), default='APPROVED') # 'APPROVED', 'PENDING', 'REJECTED'
    vote_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    votes = db.relationship('VoteTransaction', backref='nominee', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'category_id': self.category_id,
            'category_title': self.category.title if self.category else None,
            'name': self.name,
            'bio': self.bio,
            'photo_url': self.photo_url,
            'phone': self.phone,
            'email': self.email,
            'registration_type': self.registration_type,
            'status': self.status,
            'vote_count': self.vote_count,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
