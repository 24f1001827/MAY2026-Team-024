from celery import shared_task
from flask_mail import Message
from app.extensions import mail
from flask import render_template
from app.utils import format_ist

@shared_task
def send_citizen_register_email(subject, recipients,name):

    msg = Message(
        subject=subject,
        recipients=recipients,
    )
    msg.html =render_template('citizen_register.html',name=name)
        

    mail.send(msg)

@shared_task
def send_agency_register_email(subject, recipients,name,submitted_on,status):

    msg = Message(
        subject=subject,
        recipients=recipients,
    )
    msg.html =render_template('agency_register.html',name=name,submitted_on=format_ist(submitted_on),status=status)
        

    mail.send(msg) 

@shared_task
def send_officer_register_email(subject, recipients,name,department,submitted_on,status):

    msg = Message(
        subject=subject,
        recipients=recipients,
    )
    msg.html =render_template('officer_register.html',name=name,department=department,submitted_on=format_ist(submitted_on),status=status)
        

    mail.send(msg)

@shared_task
def send_agency_approve_email(subject, recipients,name,approved_on,status):

    msg = Message(
        subject=subject,
        recipients=recipients,
    )
    msg.html =render_template('agency_approve.html',name=name,approved_on=format_ist(approved_on),status=status)
        

    mail.send(msg) 

@shared_task
def send_officer_approve_email(subject, recipients,name,department,approved_on,status):

    msg = Message(
        subject=subject,
        recipients=recipients,
    )
    msg.html =render_template('officer_approve.html',name=name,department=department,approved_on=format_ist(approved_on),status=status)
        

    mail.send(msg)