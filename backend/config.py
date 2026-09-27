import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    DEBUG = os.getenv('FLASK_DEBUG', '0').lower() in ('true', '1', 'yes') or FLASK_ENV == 'development'

    # Security Keys
    SECRET_KEY = os.getenv('SECRET_KEY')
    if not SECRET_KEY:
        if FLASK_ENV == 'production':
            raise ValueError("CRITICAL SECURITY RISK: 'SECRET_KEY' must be set in production environment variables!")
        SECRET_KEY = 'dev_secret_key_open_your_heart_bethesda_gala_2026'

    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')
    if not JWT_SECRET_KEY:
        if FLASK_ENV == 'production':
            raise ValueError("CRITICAL SECURITY RISK: 'JWT_SECRET_KEY' must be set in production environment variables!")
        JWT_SECRET_KEY = 'dev_jwt_secret_key_bethesda_niangon_2026'

    # Frontend & Backend Domain / URLs & CORS
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'https://award-frontend.onrender.com').rstrip('/')
    BACKEND_URL = os.getenv('BACKEND_URL', 'https://award-backend-wnze.onrender.com').rstrip('/')
    CORS_ORIGINS = [origin.strip() for origin in os.getenv('CORS_ORIGINS', '*').split(',') if origin.strip()]

    # Database Configuration
    POSTGRES_USER = os.getenv('POSTGRES_USER', 'postgres')
    POSTGRES_PASSWORD = os.getenv('POSTGRES_PASSWORD', 'postgres')
    POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'localhost')
    POSTGRES_PORT = os.getenv('POSTGRES_PORT', '5432')
    POSTGRES_DB = os.getenv('POSTGRES_DB', 'award')
    
    raw_db_url = os.getenv('DATABASE_URL')
    if raw_db_url and raw_db_url.startswith('postgres://'):
        raw_db_url = raw_db_url.replace('postgres://', 'postgresql://', 1)

    SQLALCHEMY_DATABASE_URI = raw_db_url or (
        f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@"
        f"{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Jeko API Configuration
    JEKO_API_KEY = os.getenv('JEKO_API_KEY')
    JEKO_API_KEY_ID = os.getenv('JEKO_API_KEY_ID')
    JEKO_BASE_URL = os.getenv('JEKO_BASE_URL', 'https://api.jeko.africa/partner_api')
    JEKO_STORE_ID = os.getenv('JEKO_STORE_ID')
    JEKO_DOC_URL = os.getenv('JEKO_DOC_URL', 'https://developer.jeko.africa/')

    # SMTP Configuration
    MAIL_SERVER = os.getenv('SMTP_HOST') or os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.getenv('SMTP_PORT') or os.getenv('MAIL_PORT', 587))
    MAIL_USE_TLS = os.getenv('MAIL_USE_TLS', 'True').lower() in ('true', '1')
    MAIL_USERNAME = os.getenv('SMTP_USERNAME') or os.getenv('MAIL_USERNAME', '')
    MAIL_PASSWORD = os.getenv('SMTP_PASSWORD') or os.getenv('MAIL_PASSWORD', '')
    MAIL_DEFAULT_SENDER = os.getenv('SMTP_FROM') or os.getenv('MAIL_DEFAULT_SENDER')

    # Infobip WhatsApp Configuration
    INFOBIP_API_KEY = os.getenv('INFOBIP_API_KEY', '')
    INFOBIP_BASE_URL = os.getenv('INFOBIP_BASE_URL')
    OTP_TARGET_PHONE = os.getenv('OTP_TARGET_PHONE')
