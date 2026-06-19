import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging
from fastapi import BackgroundTasks
from .config import settings

logger = logging.getLogger("inventory_system")

def send_smtp_email(to_email: str, subject: str, html_content: str):
    if not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
        logger.info("[SIMULATED EMAIL SENDER]")
        logger.info(f"To: {to_email}")
        logger.info(f"Subject: {subject}")
        logger.info("Content simulation printing omitted to keep logs clean.")
        logger.info("------------------------")
        return
        
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
        msg["To"] = to_email
        
        part = MIMEText(html_content, "html")
        msg.attach(part)
        
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            if settings.SMTP_TLS:
                server.starttls()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM_EMAIL, to_email, msg.as_string())
        logger.info(f"Email sent successfully to {to_email}")
    except Exception as e:
        logger.error(f"Error sending email to {to_email}: {e}")

def send_email_background(background_tasks: BackgroundTasks, to_email: str, subject: str, html_content: str):
    background_tasks.add_task(send_smtp_email, to_email, subject, html_content)

def send_welcome_email(background_tasks: BackgroundTasks, user_email: str, username: str):
    subject = "Welcome to Ethara Stock!"
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; background-color: #0a0f1d; color: #f3f4f6; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #111827; border: 1px solid #374151; border-radius: 12px; padding: 30px;">
                <h1 style="color: #06b6d4; text-align: center;">Welcome to Ethara Stock</h1>
                <p>Hello <strong>{username}</strong>,</p>
                <p>Thank you for signing up for Ethara Stock Manager! Your account is active and you can now log in to manage your product catalog, orders, and customer lists.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="http://localhost:5173" style="background-color: #06b6d4; color: #0a0f1d; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Access your Dashboard</a>
                </div>
                <p style="color: #9ca3af; font-size: 0.9em; margin-top: 40px; border-top: 1px solid #374151; padding-top: 20px;">
                    This is an automated notification. Please do not reply directly to this email.
                </p>
            </div>
        </body>
    </html>
    """
    send_email_background(background_tasks, user_email, subject, html_content)

def send_password_reset_email(background_tasks: BackgroundTasks, user_email: str, token: str):
    subject = "Password Reset Request - Ethara Stock"
    reset_link = f"http://localhost:5173/?reset-token={token}"
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; background-color: #0a0f1d; color: #f3f4f6; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #111827; border: 1px solid #374151; border-radius: 12px; padding: 30px;">
                <h2 style="color: #6366f1;">Reset Your Password</h2>
                <p>You are receiving this email because we received a password reset request for your Ethara Stock account.</p>
                <p>Click the button below to set a new password. This link is valid for 15 minutes.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{reset_link}" style="background-color: #6366f1; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Reset Password</a>
                </div>
                <p>If you did not request a password reset, no further action is required.</p>
                <p style="color: #9ca3af; font-size: 0.9em; margin-top: 40px; border-top: 1px solid #374151; padding-top: 20px;">
                    If the button doesn't work, copy and paste this link into your browser:<br/>
                    <a href="{reset_link}" style="color: #6366f1;">{reset_link}</a>
                </p>
            </div>
        </body>
    </html>
    """
    send_email_background(background_tasks, user_email, subject, html_content)

def send_low_stock_alert_email(background_tasks: BackgroundTasks, user_email: str, product_name: str, sku: str, current_stock: int):
    subject = f"⚠️ Low Stock Alert: {product_name} ({sku})"
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; background-color: #0a0f1d; color: #f3f4f6; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #111827; border: 1px solid #f43f5e; border-radius: 12px; padding: 30px;">
                <h2 style="color: #f43f5e; margin-top: 0;">⚠️ Low Stock Alert</h2>
                <p>One of your products has fallen below the minimum stock threshold (10 units).</p>
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #1f2937; border-radius: 8px; overflow: hidden;">
                    <tr>
                        <td style="padding: 12px; font-weight: bold; border-bottom: 1px solid #374151;">Product Name:</td>
                        <td style="padding: 12px; border-bottom: 1px solid #374151;">{product_name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px; font-weight: bold; border-bottom: 1px solid #374151;">SKU Code:</td>
                        <td style="padding: 12px; border-bottom: 1px solid #374151; font-family: monospace; color: #06b6d4;">{sku}</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px; font-weight: bold;">Current Stock:</td>
                        <td style="padding: 12px; color: #f43f5e; font-weight: bold;">{current_stock} units left</td>
                    </tr>
                </table>
                <p>Please restock this item soon to avoid order fulfillment issues.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="http://localhost:5173" style="background-color: #f43f5e; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Manage Inventory</a>
                </div>
            </div>
        </body>
    </html>
    """
    send_email_background(background_tasks, user_email, subject, html_content)
