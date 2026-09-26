from datetime import datetime
from . import db

class Category(db.Model):
    __tablename__ = 'categories'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=True)
    icon_name = db.Column(db.String(50), default='Award')
    is_active = db.Column(db.Boolean, default=True)
    allow_self_registration = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    nominees = db.relationship('Nominee', backref='category', lazy=True, cascade='all, delete-orphan')

    def to_dict(self, include_nominees=True):
        total_category_votes = sum(n.vote_count for n in self.nominees if n.status == 'APPROVED')
        
        nominees_data = []
        if include_nominees:
            for n in self.nominees:
                if n.status == 'APPROVED':
                    n_dict = n.to_dict()
                    n_dict['vote_percentage'] = round((n.vote_count / total_category_votes * 100), 1) if total_category_votes > 0 else 0
                    nominees_data.append(n_dict)
            # Sort by vote_count descending
            nominees_data.sort(key=lambda x: x['vote_count'], reverse=True)

        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'icon_name': self.icon_name,
            'is_active': self.is_active,
            'allow_self_registration': self.allow_self_registration,
            'total_votes': total_category_votes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'nominees': nominees_data
        }
