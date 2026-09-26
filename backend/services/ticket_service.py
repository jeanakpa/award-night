import io
import base64
import random
import string
import qrcode
import requests
from PIL import Image
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
from reportlab.lib.pagesizes import landscape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from flask import current_app

def generate_ticket_reference():
    chars = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"AWN-2026-{chars}"

def generate_qr_code_base64(data_string):
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=2,
    )
    qr.add_data(data_string)
    qr.make(fit=True)

    img = qr.make_image(fill_color="#000000", back_color="#FFFFFF")
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{img_str}"

from reportlab.pdfgen import canvas
import os

def create_pdf_ticket(ticket_dict, qr_base64_str):
    """
    Generates a PDF ticket using the official IMAGES/ticket.jpg background image.
    Overlays:
    - Ticket Reference (top left after 'ticket N.')
    - Beneficiary Name (inside bottom-left dark maroon box)
    - Enlarged QR Code with white background (inside square QR box on right stub)
    """
    buffer = io.BytesIO()
    # 560 x 202.3 points (maintains 1024 x 370 ratio)
    c = canvas.Canvas(buffer, pagesize=(560, 202.3))

    # Background image path search
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
    img_path = os.path.join(base_dir, 'IMAGES', 'ticket.jpg')
    if not os.path.exists(img_path):
        img_path = os.path.join(os.path.dirname(__file__), 'ticket.jpg')

    # Draw template background image
    if os.path.exists(img_path):
        c.drawImage(img_path, 0, 0, width=560, height=202.3)

    ref = ticket_dict.get('reference', 'AWN-2026-XXXXXX')
    name = ticket_dict.get('buyer_name', '').upper()

    # 1. Draw Ticket Reference (top left, right after 'ticket N.')
    c.setFont("Helvetica-Bold", 12)
    c.setFillColor(colors.HexColor('#1A1A1A'))
    c.drawString(82, 178, ref)

    # 2. Draw Beneficiary Name (enlarged & centered inside bottom-left dark maroon box)
    c.setFont("Helvetica-Bold", 13.5)
    c.setFillColor(colors.HexColor('#FFD700'))
    c.drawCentredString(106, 17, name[:35])

    # 3. Draw QR Code (enlarged inside right stub square box on solid white background)
    qr_data = qr_base64_str.split(',')[1] if ',' in qr_base64_str else qr_base64_str
    qr_bytes = base64.b64decode(qr_data)
    qr_image_io = io.BytesIO(qr_bytes)
    
    # Solid white card background behind QR code for maximum scannability and high visibility
    c.setFillColor(colors.white)
    c.roundRect(442, 54, 96, 96, 4, fill=1, stroke=0)

    rl_qr_img = RLImage(qr_image_io, width=88, height=88)
    rl_qr_img.drawOn(c, 446, 58)

    c.showPage()
    c.save()
    buffer.seek(0)
    return buffer.getvalue()



def send_ticket_email(ticket_dict, qr_base64_str):
    """Sends email with clean HTML body and attached PDF ticket."""
    try:
        mail_username = current_app.config.get('MAIL_USERNAME')
        mail_password = current_app.config.get('MAIL_PASSWORD')
        mail_server = current_app.config.get('MAIL_SERVER')
        mail_port = current_app.config.get('MAIL_PORT')

        if not mail_username or not mail_password:
            print(f"[MAIL LOG] Simulated Email send for Ticket {ticket_dict['reference']} to {ticket_dict['buyer_email']}")
            return True, "Email simulé avec succès (SMTP non configuré)"

        msg = MIMEMultipart()
        msg['Subject'] = f"Votre Ticket Dîner Gala Award Night - Ref: {ticket_dict['reference']}"
        msg['From'] = current_app.config.get('MAIL_DEFAULT_SENDER') or mail_username
        msg['To'] = ticket_dict['buyer_email']

        total_val = ticket_dict.get('total_amount', 10000)
        amount_str = f"{total_val:,} FCFA".replace(',', '.')

        html_body = f"""
        <div style="background-color: #0B0A10; color: #FFFFFF; font-family: Arial, sans-serif; padding: 30px; border-radius: 16px; border: 2px solid #D4AF37; max-width: 580px; margin: auto;">
            <div style="text-align: center; margin-bottom: 25px;">
                <h1 style="color: #D4AF37; margin: 0; font-size: 28px; letter-spacing: 1px;">AWARD NIGHT 2026</h1>
                <p style="color: #FFD700; font-weight: bold; margin-top: 6px; font-size: 15px;">Dîner Gala & Nuit de Distinctions</p>
                <p style="color: #AAAAAA; font-size: 12px; margin-top: 4px;">Église Méthodiste de Côte d'Ivoire Temple Bethesda - Yopougon Niangon Sud</p>
            </div>
            
            <hr style="border: 0; border-top: 1px solid #2A2740; margin: 20px 0;" />
            
            <p style="font-size: 16px; margin-bottom: 12px;">Bonjour <b>{ticket_dict['buyer_name']}</b>,</p>
            <p style="font-size: 14px; color: #DDDDDD; line-height: 1.5;">
                Félicitations ! Votre paiement de <b style="color: #FFD700;">{amount_str}</b> pour l'événement <b>Award Night 2026</b> a été confirmé avec succès.
            </p>

            <div style="background: #181628; border-left: 4px solid #D4AF37; padding: 18px; margin: 24px 0; border-radius: 8px;">
                <p style="margin: 6px 0; color: #FFD700; font-size: 15px;"><b>Référence du Ticket :</b> <span style="font-family: monospace;">{ticket_dict['reference']}</span></p>
                <p style="margin: 6px 0; color: #E0E0E0;"><b>Bénéficiaire :</b> {ticket_dict['buyer_name']}</p>
                <p style="margin: 6px 0; color: #E0E0E0;"><b>Téléphone :</b> {ticket_dict['buyer_phone']}</p>
                <p style="margin: 6px 0; color: #E0E0E0;"><b>Statut du Paiement :</b> <span style="color: #22C55E; font-weight: bold;">PAYÉ & VALIDÉ</span> ({ticket_dict.get('payment_method', 'Jèko').upper()})</p>
            </div>

            <div style="background: #121020; border: 1px dashed #D4AF37; padding: 16px; border-radius: 10px; text-align: center; margin: 25px 0;">
                <p style="color: #FFD700; font-weight: bold; margin: 0 0 6px 0; font-size: 14px;">📄 Votre Billet PDF Officiel avec QR Code est ci-joint</p>
                <p style="color: #AAAAAA; font-size: 12px; margin: 0;">Veuillez télécharger le document PDF ci-joint <b>Ticket_{ticket_dict['reference']}.pdf</b> et présenter son QR Code à l'entrée du Gala le <b>25 Décembre 2026</b>.</p>
            </div>

            <p style="font-size: 13px; color: #888888; text-align: center; margin-top: 25px;">
                Merci et rendez-vous le 25 Décembre !<br/>
                <i>Jeunesse Méthodiste Niangon Sud</i>
            </p>
        </div>
        """

        msg.attach(MIMEText(html_body, 'html'))

        # Attach PDF Ticket
        pdf_bytes = create_pdf_ticket(ticket_dict, qr_base64_str)
        pdf_attachment = MIMEApplication(pdf_bytes, _subtype="pdf")
        pdf_attachment.add_header('Content-Disposition', 'attachment', filename=f"Ticket_{ticket_dict['reference']}.pdf")
        msg.attach(pdf_attachment)

        # Connect SMTP
        server = smtplib.SMTP(mail_server, int(mail_port), timeout=15)
        if current_app.config.get('MAIL_USE_TLS', True):
            server.starttls()
        server.login(mail_username, mail_password)
        server.send_message(msg)
        server.quit()

        print(f"[SMTP SUCCESS] Email delivered to {ticket_dict['buyer_email']}")
        return True, "Email envoyé avec succès"
    except Exception as e:
        print(f"[SMTP ERROR] Erreur d'envoi d'email: {e}")
        return False, str(e)

def send_whatsapp_notification(ticket_dict, sender_number=None):
    """
    Triggers Infobip WhatsApp API message using exact user requested template.
    """
    try:
        api_key = current_app.config.get('INFOBIP_API_KEY', '')
        base_url = current_app.config.get('INFOBIP_BASE_URL', '')
        primary_sender = sender_number or current_app.config.get('OTP_TARGET_PHONE', '447860088970')
        recipient_phone = ticket_dict.get('buyer_whatsapp') or ticket_dict.get('buyer_phone', '')

        clean_phone = ''.join(c for c in str(recipient_phone) if c.isdigit())
        if len(clean_phone) == 10 and clean_phone.startswith('0'):
            clean_phone = '225' + clean_phone

        total_val = ticket_dict.get('total_amount', 10000)
        amount_formatted = f"{total_val:,}".replace(',', ' ')

        message_text = (
            f"🎉 *CONFIRMATION DE TICKET - AWARD NIGHT 2026*\n\n"
            f"Bonjour *{ticket_dict.get('buyer_name')}*,\n"
            f"Votre transaction a bien été effectuée !\n\n"
            f"🎟️ *Ticket Ref :* {ticket_dict.get('reference')}\n"
            f"🔢 *Quantité :* {ticket_dict.get('quantity', 1)} ticket(s)\n"
            f"💰 *Montant Payé :* {amount_formatted} FCFA\n\n"
            f"📧 Votre ticket PDF avec QR Code d'accès vous a été envoyé par email.\n\n"
            f"Merci et rendez-vous le 25 décembre !"
        )

        if api_key and base_url:
            endpoint = f"https://{base_url}/whatsapp/1/message/text" if not base_url.startswith('http') else f"{base_url}/whatsapp/1/message/text"
            headers = {
                'Authorization': f"App {api_key}",
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }

            payload = {
                "from": primary_sender,
                "to": clean_phone,
                "content": {
                    "text": message_text
                }
            }

            print(f"[INFOBIP WHATSAPP DISPATCH] Sender: {primary_sender} -> Target: {clean_phone}")
            res = requests.post(endpoint, json=payload, headers=headers, timeout=10)
            print(f"[INFOBIP WHATSAPP RESP] Status {res.status_code}: {res.text}")
            if res.status_code == 200:
                return True, f"WhatsApp Infobip envoyé à {clean_phone} depuis {primary_sender}"

        print(f"[WHATSAPP DISPATCH LOG] Recipient: {recipient_phone}")
        print(f"[WHATSAPP CONTENT]\n{message_text}\n")
        return True, f"WhatsApp simulé pour {recipient_phone}"

    except Exception as e:
        print(f"[WHATSAPP ERROR] Erreur WhatsApp: {e}")
        return False, str(e)




