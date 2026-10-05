from django.contrib import admin
from .models import Ticket, ServiceRequest, ContactMessage, Page
for m in (ContactMessage, Page): admin.site.register(m)
@admin.register(Ticket)
class TA(admin.ModelAdmin): list_display = ("subject", "user", "status", "created"); list_editable = ("status",)
@admin.register(ServiceRequest)
class RA(admin.ModelAdmin): list_display = ("service", "user", "status", "created"); list_editable = ("status",)
from .models import Reply
admin.site.register(Reply)
from .models import Role, Profile
admin.site.register(Role); admin.site.register(Profile)
