import psycopg2

try:
    conn = psycopg2.connect('postgresql://postgres:postgre@localhost:5432/postgres')
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute("SELECT 1 FROM pg_database WHERE datname='award_night'")
    if not cur.fetchone():
        cur.execute("CREATE DATABASE award_night")
        print("Database award_night created successfully!")
    else:
        print("Database award_night already exists!")
    cur.close()
    conn.close()
except Exception as e:
    print("PostgreSQL error:", e)
