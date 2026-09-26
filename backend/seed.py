from app import app
from models import db, Admin, Category, Nominee, Setting
from datetime import datetime, timedelta

def seed_database():
    with app.app_context():
        print("Initializing database tables...")
        db.create_all()

        # Seed Default Admin if not existing
        admin = Admin.query.filter_by(username='admin').first()
        if not admin:
            admin = Admin(
                username='admin',
                email='admin@awardnight.ci',
                full_name='Administrateur Bethesda',
                role='SUPER_ADMIN'
            )
            admin.set_password('award2026')
            db.session.add(admin)
            print("Default admin created: admin / award2026")

        # Seed Settings
        if not Setting.get('self_registration_deadline'):
            # Default deadline: 20 Dec 2026 at 23:59
            default_deadline = (datetime.utcnow() + timedelta(days=90)).strftime("%Y-%m-%dT23:59")
            Setting.set('self_registration_deadline', default_deadline)

        # Seed Categories from presentation doc
        initial_categories = [
            {
                "title": "Meilleur(e) serviteur/servante de l'année",
                "description": "Prix récompensant le dévouement et l'engagement spirituel et pratique d'un membre.",
                "icon_name": "Sparkles",
                "nominees": [
                    {"name": "Marc-Aurèle KOUASSI", "bio": "Engagement remarquable au service d'accueil et d'intercession.", "photo_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80", "votes": 42},
                    {"name": "Grace ADOU", "bio": "Service fidèle et gestion exemplaire des activités de jeunesse.", "photo_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80", "votes": 58},
                    {"name": "Emmanuel YAO", "bio": "Investissement total dans les projets communautaires et cultes.", "photo_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80", "votes": 35}
                ]
            },
            {
                "title": "Meilleure assiduité",
                "description": "Distinction attribuée pour la régularité et la présence constante aux activités.",
                "icon_name": "Clock",
                "nominees": [
                    {"name": "Prisca BONY", "bio": "Présente à tous les cultes et rencontres de jeunesse de l'année.", "photo_url": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80", "votes": 64},
                    {"name": "Cédric DAGO", "bio": "Exemple de ponctualité et d'assiduité sans faille.", "photo_url": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80", "votes": 41}
                ]
            },
            {
                "title": "Révélation de l'année",
                "description": "Prix accordé au nouveau talent ou membre s'étant particulièrement illustré cette année.",
                "icon_name": "Award",
                "nominees": [
                    {"name": "Kevin BLE", "bio": "Intégration rapide et initiative novatrice en sonorisation.", "photo_url": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80", "votes": 79},
                    {"name": "Esther TOURE", "bio": "Voix révélatrice de la chorale et leadership enthousiaste.", "photo_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80", "votes": 65}
                ]
            },
            {
                "title": "Meilleur département / commission",
                "description": "Récompense attribuée à l'équipe la plus dynamique, organisée et percutante.",
                "icon_name": "Users",
                "nominees": [
                    {"name": "Département Logistique & Décoration", "bio": "Organisation impeccable de tous les grands rassemblements.", "photo_url": "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=400&q=80", "votes": 120},
                    {"name": "Commission Média & Communication", "bio": "Rayonnement visuel et présence digitale exceptionnelle.", "photo_url": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=400&q=80", "votes": 98}
                ]
            }
        ]

        for cat_data in initial_categories:
            cat = Category.query.filter_by(title=cat_data["title"]).first()
            if not cat:
                cat = Category(
                    title=cat_data["title"],
                    description=cat_data["description"],
                    icon_name=cat_data["icon_name"],
                    allow_self_registration=True
                )
                db.session.add(cat)
                db.session.flush()

                for nom_data in cat_data["nominees"]:
                    nom = Nominee(
                        category_id=cat.id,
                        name=nom_data["name"],
                        bio=nom_data["bio"],
                        photo_url=nom_data["photo_url"],
                        registration_type='ADMIN',
                        status='APPROVED',
                        vote_count=nom_data["votes"]
                    )
                    db.session.add(nom)

        db.session.commit()
        print("Database seeded successfully!")

if __name__ == '__main__':
    seed_database()
