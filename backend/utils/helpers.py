import os
import re
import socket

def sanitize_phone_number(phone_str):
    """Sanitizes phone number to standard format."""
    if not phone_str:
        return ''
    cleaned = re.sub(r'[^\d+]', '', phone_str)
    if not cleaned.startswith('+') and not cleaned.startswith('225') and len(cleaned) == 10:
        return f"+225{cleaned}"
    return cleaned

def format_currency(amount):
    """Formats amount to FCFA string."""
    return f"{amount:,.0f} FCFA".replace(',', ' ')

def get_lan_ip():
    """Gets primary LAN / Wi-Fi IP address of the host machine."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def extract_request_network_ip():
    """
    Detects active network IP/domain from request headers (Origin, Referer, X-Forwarded-Host, Host),
    falling back to primary LAN socket IP.
    """
    try:
        from flask import request
        # Check Origin or Referer header
        origin = request.headers.get('Origin') or request.headers.get('Referer') or ''
        if origin and '://' in origin:
            host_part = origin.split('://')[1].split('/')[0].split(':')[0]
            if host_part and host_part not in ('localhost', '127.0.0.1'):
                return host_part

        # Check X-Forwarded-Host or Host
        req_host = request.headers.get('X-Forwarded-Host') or request.headers.get('Host') or ''
        if req_host:
            host_part = req_host.split(':')[0]
            if host_part and host_part not in ('localhost', '127.0.0.1'):
                return host_part
    except Exception:
        pass

    return get_lan_ip()


