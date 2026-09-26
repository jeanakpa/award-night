import os
import sys
from app import create_app
from models import db, Ticket, AdminUser, PaymentLog

def generate_sql_dump(output_filename="database_dump.sql"):
    app = create_app()
    with app.app_context():
        sql_lines = []
        sql_lines.append("-- ========================================================")
        sql_lines.append("-- SQL DATABASE DUMP - AWARD NIGHT PLATFORM 2026")
        sql_lines.append("-- ========================================================\n")
        
        # 1. ADMIN USERS TABLE
        sql_lines.append("-- --------------------------------------------------------")
        sql_lines.append("-- Table Structure: admin_users")
        sql_lines.append("-- --------------------------------------------------------")
        sql_lines.append("""CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(60) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);\n""")

        # Data for admin_users
        admins = AdminUser.query.all()
        if admins:
            sql_lines.append("-- Data for admin_users")
            for a in admins:
                pwd = a.password_hash.replace("'", "''")
                sql_lines.append(f"INSERT INTO admin_users (username, password_hash, role) VALUES ('{a.username}', '{pwd}', '{a.role}') ON CONFLICT (username) DO NOTHING;")
            sql_lines.append("")

        # 2. TICKETS TABLE
        sql_lines.append("-- --------------------------------------------------------")
        sql_lines.append("-- Table Structure: tickets")
        sql_lines.append("-- --------------------------------------------------------")
        sql_lines.append("""CREATE TABLE IF NOT EXISTS tickets (
    id SERIAL PRIMARY KEY,
    reference VARCHAR(32) UNIQUE NOT NULL,
    buyer_name VARCHAR(120) NOT NULL,
    buyer_phone VARCHAR(30) NOT NULL,
    buyer_whatsapp VARCHAR(30) NOT NULL,
    buyer_email VARCHAR(120) NOT NULL,
    ticket_type VARCHAR(50) DEFAULT 'Standard',
    quantity INTEGER DEFAULT 1,
    unit_price INTEGER DEFAULT 10,
    total_amount INTEGER DEFAULT 10,
    payment_method VARCHAR(50) DEFAULT 'jeko',
    payment_status VARCHAR(30) DEFAULT 'PENDING',
    transaction_ref VARCHAR(100),
    jeko_payment_id VARCHAR(100),
    redirect_url TEXT,
    qr_code_data TEXT,
    checked_in BOOLEAN DEFAULT FALSE,
    checked_in_at TIMESTAMP,
    email_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);\n""")

        # Data for tickets
        tickets = Ticket.query.all()
        if tickets:
            sql_lines.append("-- Data for tickets")
            for t in tickets:
                name = t.buyer_name.replace("'", "''")
                phone = t.buyer_phone.replace("'", "''")
                wa = (t.buyer_whatsapp or t.buyer_phone).replace("'", "''")
                email = t.buyer_email.replace("'", "''")
                method = (t.payment_method or 'jeko').replace("'", "''")
                status = (t.payment_status or 'PENDING').replace("'", "''")
                tx_ref = f"'{t.transaction_ref}'" if t.transaction_ref else "NULL"
                jeko_id = f"'{t.jeko_payment_id}'" if t.jeko_payment_id else "NULL"
                qr_data = f"'{t.qr_code_data}'" if t.qr_code_data else "NULL"
                
                sql_lines.append(
                    f"INSERT INTO tickets (reference, buyer_name, buyer_phone, buyer_whatsapp, buyer_email, ticket_type, quantity, unit_price, total_amount, payment_method, payment_status, transaction_ref, jeko_payment_id, qr_code_data, checked_in, email_sent) "
                    f"VALUES ('{t.reference}', '{name}', '{phone}', '{wa}', '{email}', '{t.ticket_type}', {t.quantity}, {t.unit_price}, {t.total_amount}, '{method}', '{status}', {tx_ref}, {jeko_id}, {qr_data}, {'TRUE' if t.checked_in else 'FALSE'}, {'TRUE' if t.email_sent else 'FALSE'}) "
                    f"ON CONFLICT (reference) DO NOTHING;"
                )
            sql_lines.append("")

        # 3. PAYMENT LOGS TABLE
        sql_lines.append("-- --------------------------------------------------------")
        sql_lines.append("-- Table Structure: payment_logs")
        sql_lines.append("-- --------------------------------------------------------")
        sql_lines.append("""CREATE TABLE IF NOT EXISTS payment_logs (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES tickets(id),
    operator VARCHAR(50),
    status VARCHAR(30),
    raw_payload TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);\n""")

        logs = PaymentLog.query.all()
        if logs:
            sql_lines.append("-- Data for payment_logs")
            for l in logs:
                payload = l.raw_payload.replace("'", "''") if l.raw_payload else "NULL"
                sql_lines.append(f"INSERT INTO payment_logs (ticket_id, operator, status, raw_payload) VALUES ({l.ticket_id or 'NULL'}, '{l.operator}', '{l.status}', '{payload}');")

        dump_path = os.path.abspath(output_filename)
        with open(dump_path, 'w', encoding='utf-8') as f:
            f.write("\n".join(sql_lines))

        print(f"Dump SQL généré avec succès dans : {dump_path}")
        return dump_path

if __name__ == '__main__':
    generate_sql_dump()
