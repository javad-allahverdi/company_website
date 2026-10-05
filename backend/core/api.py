from django.contrib.auth.models import User
from django.core.files.storage import default_storage
from django.urls import path, include
from rest_framework import serializers, viewsets, permissions, routers
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import obtain_auth_token
from rest_framework.decorators import api_view, action, parser_classes
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Ticket, ServiceRequest, ContactMessage, Page, Reply, Role, Profile

ALL = ["tickets", "pages", "users"]
DEFAULT_ROLES = {"admin": ("مدیر کل", ALL), "support": ("پشتیبان", ["tickets"]),
                 "editor": ("ویرایشگر محتوا", ["pages"]), "customer": ("کاربر عادی", [])}
def ensure_roles():
    for k, (t, p) in DEFAULT_ROLES.items(): Role.objects.get_or_create(key=k, defaults={"title": t, "perms": p})
def role_of(u):
    if u.is_superuser: return "admin"
    p = Profile.objects.filter(user=u).select_related("role").first()
    return p.role.key if p and p.role else "customer"
def perms(u):
    if not u.is_authenticated: return []
    if u.is_superuser: return ALL
    p = Profile.objects.filter(user=u).select_related("role").first()
    return p.role.perms if p and p.role else []
def can(u, x): return x in perms(u)
def set_role(u, key):
    ensure_roles(); Profile.objects.update_or_create(user=u, defaults={"role": Role.objects.filter(key=key).first() or Role.objects.get(key="customer")})

class Base(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    replies = serializers.SerializerMethodField()
    def get_replies(self, o):
        qs = Reply.objects.filter(kind=self.kind, obj_id=o.id).select_related("user")
        return [{"id": r.id, "message": r.message, "username": r.user.username, "is_staff": can(r.user, "tickets")} for r in qs]
class TicketS(Base):
    kind = "tickets"
    class Meta: model = Ticket; fields = "__all__"; read_only_fields = ["user", "status"]
class RequestS(Base):
    kind = "requests"
    class Meta: model = ServiceRequest; fields = "__all__"; read_only_fields = ["user", "status"]
class ContactS(serializers.ModelSerializer):
    class Meta: model = ContactMessage; fields = "__all__"

class Owned(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        return self.queryset if can(self.request.user, "tickets") else self.queryset.filter(user=self.request.user)
    def perform_create(self, s): s.save(user=self.request.user)
    @action(detail=True, methods=["post"])
    def reply(self, request, pk=None):
        o = self.get_object(); msg = str(request.data.get("message", "")).strip()
        if not msg or o.status == "closed": return Response(status=400)
        Reply.objects.create(kind=self.kind, obj_id=o.pk, user=request.user, message=msg)
        o.status = "pending" if can(request.user, "tickets") else "open"; o.save()
        return Response(status=201)
    @action(detail=True, methods=["post"])
    def status(self, request, pk=None):
        if not can(request.user, "tickets"): return Response(status=403)
        o = self.get_object(); o.status = request.data.get("status", "open"); o.save()
        return Response(status=200)
class TicketV(Owned): kind = "tickets"; queryset = Ticket.objects.all(); serializer_class = TicketS
class RequestV(Owned): kind = "requests"; queryset = ServiceRequest.objects.all(); serializer_class = RequestS
class ContactV(viewsets.ModelViewSet):
    queryset = ContactMessage.objects.none(); serializer_class = ContactS
    http_method_names = ["post"]; permission_classes = [permissions.AllowAny]

@api_view(["POST"])
def register(request):
    u, p = request.data.get("username"), request.data.get("password")
    if not u or not p or User.objects.filter(username=u).exists():
        return Response({"error": "نام کاربری نامعتبر یا تکراری است"}, status=400)
    user = User.objects.create_user(u, request.data.get("email", ""), p)
    return Response({"token": Token.objects.create(user=user).key})

@api_view(["GET", "PUT"])
def page(request, slug):
    if slug not in ("home", "about", "contact", "site"): return Response(status=404)
    obj, _ = Page.objects.get_or_create(slug=slug)
    if request.method == "PUT":
        if not (can(request.user, "pages")): return Response(status=403)
        obj.data = request.data; obj.save()
    return Response(obj.data)

@api_view(["GET"])
def me(request):
    if not request.user.is_authenticated: return Response(status=401)
    ensure_roles(); k = role_of(request.user)
    return Response({"username": request.user.username, "role": k, "role_title": Role.objects.get(key=k).title, "perms": perms(request.user)})

@api_view(["POST"])
@parser_classes([MultiPartParser])
def upload(request):
    if not (can(request.user, "pages")): return Response(status=403)
    f = request.FILES.get("file")
    if not f or f.content_type not in ("image/png", "image/jpeg", "image/webp") or f.size > 3 * 1024 * 1024:
        return Response({"error": "فقط تصویر png/jpg/webp تا ۳ مگابایت"}, status=400)
    name = default_storage.save(f"uploads/{f.name}", f)
    return Response({"url": request.build_absolute_uri(default_storage.url(name))})

r = routers.DefaultRouter()
r.register("tickets", TicketV); r.register("requests", RequestV); r.register("contact", ContactV)
urlpatterns = [path("", include(r.urls)), path("register/", register), path("login/", obtain_auth_token),
               path("pages/<slug:slug>/", page), path("me/", me), path("upload/", upload)]

def ser(u): return {"id": u.id, "username": u.username, "email": u.email, "role": role_of(u), "is_active": u.is_active, "is_superuser": u.is_superuser}

@api_view(["GET", "POST"])
def users(request):
    if not can(request.user, "users"): return Response(status=403)
    ensure_roles()
    if request.method == "POST":
        d = request.data
        if not d.get("username") or not d.get("password") or User.objects.filter(username=d["username"]).exists():
            return Response({"error": "نام کاربری نامعتبر یا تکراری است"}, status=400)
        set_role(User.objects.create_user(d["username"], d.get("email", ""), d["password"]), d.get("role"))
    return Response([ser(u) for u in User.objects.order_by("-date_joined")])

@api_view(["PATCH"])
def user_edit(request, pk):
    if not can(request.user, "users"): return Response(status=403)
    u, d = get_object_or_404(User, pk=pk), request.data
    if u == request.user and ("role" in d or "is_active" in d):
        return Response({"error": "نمی‌توانید نقش یا وضعیت حساب خودتان را تغییر دهید"}, status=400)
    if "role" in d and not u.is_superuser: set_role(u, d["role"])
    if "is_active" in d and not u.is_superuser: u.is_active = bool(d["is_active"]); u.save()
    if d.get("password"): u.set_password(d["password"]); u.save(); Token.objects.filter(user=u).delete()
    return Response(ser(u))

@api_view(["GET"])
def roles(request):
    if not can(request.user, "users"): return Response(status=403)
    ensure_roles(); return Response(list(Role.objects.values("key", "title", "perms")))
urlpatterns += [path("users/", users), path("users/<int:pk>/", user_edit), path("roles/", roles)]
