from django.conf import settings
from django.db import models

STATUS = [("open", "باز"), ("pending", "در حال بررسی"), ("closed", "بسته")]

class Ticket(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    subject = models.CharField(max_length=200)
    message = models.TextField()
    status = models.CharField(max_length=10, choices=STATUS, default="open")
    created = models.DateTimeField(auto_now_add=True)
    class Meta: ordering = ["-created"]

class ServiceRequest(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    service = models.CharField(max_length=100)
    description = models.TextField()
    status = models.CharField(max_length=10, choices=STATUS, default="open")
    created = models.DateTimeField(auto_now_add=True)
    class Meta: ordering = ["-created"]

class ContactMessage(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField()
    message = models.TextField()
    created = models.DateTimeField(auto_now_add=True)

class Page(models.Model):
    slug = models.SlugField(unique=True)
    data = models.JSONField(default=dict)

class Reply(models.Model):
    kind = models.CharField(max_length=10)
    obj_id = models.PositiveIntegerField()
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    message = models.TextField()
    created = models.DateTimeField(auto_now_add=True)
    class Meta: ordering = ["created"]

class Role(models.Model):
    key = models.SlugField(unique=True)
    title = models.CharField(max_length=60)
    perms = models.JSONField(default=list, help_text='فهرستی از: "tickets", "pages", "users"')
    def __str__(self): return self.title

class Profile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    role = models.ForeignKey(Role, null=True, blank=True, on_delete=models.SET_NULL)
