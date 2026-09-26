import unittest
from app import app
from models import db, Ticket

class GalaApiTestCase(unittest.TestCase):
    def setUp(self):
        self.app = app
        self.app.config['TESTING'] = True
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.client = self.app.test_client()

        with self.app.app_context():
            db.create_all()

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def test_purchase_ticket(self):
        response = self.client.post('/api/tickets/purchase', json={
            'buyer_name': 'Test User',
            'buyer_phone': '0701020304',
            'buyer_whatsapp': '0701020304',
            'buyer_email': 'test@example.com',
            'quantity': 1
        })
        self.assertEqual(response.status_code, 201)
        data = response.get_json()
        self.assertIn('ticket', data)
        self.assertEqual(data['ticket']['buyer_name'], 'Test User')

    def test_jeko_initiate_payment(self):
        # Create a ticket first
        with self.app.app_context():
            ticket = Ticket(
                reference="OYH-2026-TEST01",
                buyer_name="Test User",
                buyer_phone="0701020304",
                buyer_whatsapp="0701020304",
                buyer_email="test@example.com",
                quantity=1,
                total_amount=10000
            )
            db.session.add(ticket)
            db.session.commit()

        response = self.client.post('/api/payments/jeko-initiate', json={
            'reference': 'OYH-2026-TEST01',
            'operator': 'wave'
        })
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data.get('success'))
        self.assertIn('redirect_url', data)

if __name__ == '__main__':
    unittest.main()
