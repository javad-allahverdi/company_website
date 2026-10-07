from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.core.files.storage import default_storage
from django.shortcuts import get_object_or_404

from rest_framework import (
    serializers,
    viewsets,
    permissions,
    routers,
)
from rest_framework.authtoken.models import Token
from rest_framework.decorators import (
    api_view,
    action,
    parser_classes,
)
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response

from .models import (
    Ticket,
    ServiceRequest,
    ContactMessage,
    Page,
    Reply,
    Role,
    Profile,
)

from .serializers import (
    TicketSerializer,
    ServiceRequestSerializer,
    ContactMessageSerializer,
)


# =========================================================
# Roles
# =========================================================

ALL_PERMISSIONS = [
    "tickets",
    "pages",
    "users",
]


DEFAULT_ROLES = {
    "admin": (
        "مدیر کل",
        ALL_PERMISSIONS,
    ),

    "support": (
        "پشتیبان",
        ["tickets"],
    ),

    "editor": (
        "ویرایشگر محتوا",
        ["pages"],
    ),

    "customer": (
        "کاربر عادی",
        [],
    ),
}


def ensure_roles():
    for key, (title, perms_list) in DEFAULT_ROLES.items():

        Role.objects.get_or_create(
            key=key,
            defaults={
                "title": title,
                "perms": perms_list,
            }
        )


def role_of(user):

    if user.is_superuser:
        return "admin"

    profile = (
        Profile.objects
        .filter(user=user)
        .select_related("role")
        .first()
    )

    if profile and profile.role:
        return profile.role.key

    return "customer"


def get_permissions(user):

    if not user.is_authenticated:
        return []

    if user.is_superuser:
        return ALL_PERMISSIONS

    profile = (
        Profile.objects
        .filter(user=user)
        .select_related("role")
        .first()
    )

    if profile and profile.role:
        return profile.role.perms

    return []


def can(user, permission):

    return permission in get_permissions(user)


def set_role(user, role_key):

    ensure_roles()

    role = Role.objects.filter(
        key=role_key
    ).first()

    if not role:
        role = Role.objects.get(
            key="customer"
        )

    Profile.objects.update_or_create(
        user=user,
        defaults={
            "role": role
        }
    )


# =========================================================
# Login
# =========================================================

@api_view(["POST"])
def login(request):

    username = str(
        request.data.get("username", "")
    ).strip()

    password = str(
        request.data.get("password", "")
    )

    if not username or not password:

        return Response(
            {
                "error": "نام کاربری و رمز عبور الزامی است"
            },
            status=400
        )

    user = authenticate(
        request=request,
        username=username,
        password=password
    )

    if user is None:

        return Response(
            {
                "error": "نام کاربری یا رمز عبور اشتباه است"
            },
            status=401
        )

    if not user.is_active:

        return Response(
            {
                "error": "حساب کاربری غیرفعال است"
            },
            status=403
        )

    ensure_roles()

    token, created = Token.objects.get_or_create(
        user=user
    )

    role = role_of(user)

    return Response(
        {
            "token": token.key,

            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": role,
                "role_title": Role.objects.get(
                    key=role
                ).title,
                "perms": get_permissions(user),
                "is_staff": user.is_staff,
                "is_superuser": user.is_superuser,
            }
        },
        status=200
    )


# =========================================================
# Register
# =========================================================

@api_view(["POST"])
def register(request):

    username = str(
        request.data.get("username", "")
    ).strip()

    password = str(
        request.data.get("password", "")
    )

    email = str(
        request.data.get("email", "")
    ).strip()

    if not username or not password:

        return Response(
            {
                "error": "نام کاربری و رمز عبور الزامی است"
            },
            status=400
        )

    if User.objects.filter(
        username=username
    ).exists():

        return Response(
            {
                "error": "این نام کاربری قبلاً ثبت شده است"
            },
            status=400
        )

    user = User.objects.create_user(
        username=username,
        email=email,
        password=password
    )

    set_role(
        user,
        "customer"
    )

    token = Token.objects.create(
        user=user
    )

    return Response(
        {
            "token": token.key,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": "customer",
                "perms": [],
            }
        },
        status=201
    )


# =========================================================
# Base Owned ViewSet
# =========================================================

class OwnedViewSet(viewsets.ModelViewSet):

    permission_classes = [
        permissions.IsAuthenticated
    ]

    def get_queryset(self):

        if can(
            self.request.user,
            "tickets"
        ):
            return self.queryset

        return self.queryset.filter(
            user=self.request.user
        )

    def perform_create(self, serializer):

        serializer.save(
            user=self.request.user
        )

    @action(
        detail=True,
        methods=["post"]
    )
    def reply(self, request, pk=None):

        obj = self.get_object()

        message = str(
            request.data.get(
                "message",
                ""
            )
        ).strip()

        if not message:

            return Response(
                {
                    "error": "متن پاسخ الزامی است"
                },
                status=400
            )

        if obj.status == "closed":

            return Response(
                {
                    "error": "این درخواست بسته شده است"
                },
                status=400
            )

        Reply.objects.create(
            kind=self.reply_kind,
            obj_id=obj.pk,
            user=request.user,
            message=message
        )

        if can(
            request.user,
            "tickets"
        ):

            obj.status = "pending"

        else:

            obj.status = "open"

        obj.save(
            update_fields=["status"]
        )

        return Response(
            {
                "message": "پاسخ با موفقیت ثبت شد"
            },
            status=201
        )

    @action(
        detail=True,
        methods=["post"]
    )
    def status(self, request, pk=None):

        if not can(
            request.user,
            "tickets"
        ):

            return Response(
                {
                    "error": "دسترسی ندارید"
                },
                status=403
            )

        obj = self.get_object()

        new_status = request.data.get(
            "status"
        )

        valid_statuses = [
            "open",
            "pending",
            "closed"
        ]

        if new_status not in valid_statuses:

            return Response(
                {
                    "error": "وضعیت نامعتبر است"
                },
                status=400
            )

        obj.status = new_status

        obj.save(
            update_fields=["status"]
        )

        return Response(
            {
                "message": "وضعیت تغییر کرد",
                "status": obj.status
            }
        )


# =========================================================
# Ticket
# =========================================================

class TicketViewSet(OwnedViewSet):

    reply_kind = "tickets"

    queryset = Ticket.objects.all()

    serializer_class = TicketSerializer


# =========================================================
# Service Request
# =========================================================

class ServiceRequestViewSet(OwnedViewSet):

    reply_kind = "requests"

    queryset = ServiceRequest.objects.all()

    serializer_class = ServiceRequestSerializer


# =========================================================
# Contact
# =========================================================

class ContactViewSet(viewsets.ModelViewSet):

    queryset = ContactMessage.objects.none()

    serializer_class = ContactMessageSerializer

    http_method_names = [
        "post"
    ]

    permission_classes = [
        permissions.AllowAny
    ]


# =========================================================
# Pages
# =========================================================

ALLOWED_PAGES = [
    "home",
    "about",
    "contact",
    "site",
    "products",
]


@api_view([
    "GET",
    "PUT"
])
def page(request, slug):

    if slug not in ALLOWED_PAGES:

        return Response(
            {
                "error": "صفحه پیدا نشد"
            },
            status=404
        )

    obj, created = Page.objects.get_or_create(
        slug=slug
    )

    if request.method == "PUT":

        if not can(
            request.user,
            "pages"
        ):

            return Response(
                {
                    "error": "دسترسی ندارید"
                },
                status=403
            )

        obj.data = request.data

        obj.save()

    return Response(
        obj.data
    )


# =========================================================
# Me
# =========================================================

@api_view(["GET"])
def me(request):

    if not request.user.is_authenticated:

        return Response(
            {
                "error": "احراز هویت نشده است"
            },
            status=401
        )

    ensure_roles()

    role = role_of(
        request.user
    )

    role_obj = Role.objects.get(
        key=role
    )

    return Response(
        {
            "id": request.user.id,
            "username": request.user.username,
            "email": request.user.email,
            "role": role,
            "role_title": role_obj.title,
            "perms": get_permissions(
                request.user
            ),
            "is_staff": request.user.is_staff,
            "is_superuser": request.user.is_superuser,
        }
    )


# =========================================================
# Upload
# =========================================================

@api_view(["POST"])
@parser_classes([
    MultiPartParser
])
def upload(request):

    if not can(
        request.user,
        "pages"
    ):

        return Response(
            {
                "error": "دسترسی ندارید"
            },
            status=403
        )

    file = request.FILES.get(
        "file"
    )

    if not file:

        return Response(
            {
                "error": "فایلی ارسال نشده است"
            },
            status=400
        )

    allowed_types = [
        "image/png",
        "image/jpeg",
        "image/webp",
    ]

    if file.content_type not in allowed_types:

        return Response(
            {
                "error":
                    "فقط تصویر png/jpg/webp مجاز است"
            },
            status=400
        )

    if file.size > 3 * 1024 * 1024:

        return Response(
            {
                "error":
                    "حداکثر حجم فایل ۳ مگابایت است"
            },
            status=400
        )

    name = default_storage.save(
        f"uploads/{file.name}",
        file
    )

    return Response(
        {
            "url": request.build_absolute_uri(
                default_storage.url(name)
            )
        },
        status=201
    )


# =========================================================
# Users
# =========================================================

def serialize_user(user):

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": role_of(user),
        "is_active": user.is_active,
        "is_staff": user.is_staff,
        "is_superuser": user.is_superuser,
    }


@api_view([
    "GET",
    "POST"
])
def users(request):

    if not can(
        request.user,
        "users"
    ):

        return Response(
            {
                "error": "دسترسی ندارید"
            },
            status=403
        )

    ensure_roles()

    if request.method == "POST":

        data = request.data

        username = str(
            data.get(
                "username",
                ""
            )
        ).strip()

        password = str(
            data.get(
                "password",
                ""
            )
        )

        email = str(
            data.get(
                "email",
                ""
            )
        ).strip()

        role = data.get(
            "role",
            "customer"
        )

        if not username or not password:

            return Response(
                {
                    "error":
                        "نام کاربری و رمز عبور الزامی است"
                },
                status=400
            )

        if User.objects.filter(
            username=username
        ).exists():

            return Response(
                {
                    "error":
                        "نام کاربری تکراری است"
                },
                status=400
            )

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password
        )

        set_role(
            user,
            role
        )

        return Response(
            serialize_user(user),
            status=201
        )

    return Response(
        [
            serialize_user(user)
            for user in User.objects.order_by(
                "-date_joined"
            )
        ]
    )


# =========================================================
# Edit User
# =========================================================

@api_view(["PATCH"])
def user_edit(request, pk):

    if not can(
        request.user,
        "users"
    ):

        return Response(
            {
                "error": "دسترسی ندارید"
            },
            status=403
        )

    user = get_object_or_404(
        User,
        pk=pk
    )

    data = request.data

    if (
        user == request.user
        and (
            "role" in data
            or "is_active" in data
        )
    ):

        return Response(
            {
                "error":
                    "نمی‌توانید نقش یا وضعیت حساب خودتان را تغییر دهید"
            },
            status=400
        )

    if (
        "role" in data
        and not user.is_superuser
    ):

        set_role(
            user,
            data["role"]
        )

    if (
        "is_active" in data
        and not user.is_superuser
    ):

        user.is_active = bool(
            data["is_active"]
        )

        user.save(
            update_fields=["is_active"]
        )

    if data.get("password"):

        user.set_password(
            data["password"]
        )

        user.save(
            update_fields=["password"]
        )

        Token.objects.filter(
            user=user
        ).delete()

    return Response(
        serialize_user(user)
    )


# =========================================================
# Roles
# =========================================================

@api_view(["GET"])
def roles(request):

    if not can(
        request.user,
        "users"
    ):

        return Response(
            {
                "error": "دسترسی ندارید"
            },
            status=403
        )

    ensure_roles()

    return Response(
        list(
            Role.objects.values(
                "key",
                "title",
                "perms"
            )
        )
    )


# =========================================================
# Router
# =========================================================

router = routers.DefaultRouter()

router.register(
    "tickets",
    TicketViewSet,
    basename="tickets"
)

router.register(
    "requests",
    ServiceRequestViewSet,
    basename="requests"
)

router.register(
    "contact",
    ContactViewSet,
    basename="contact"
)


# =========================================================
# URLs
# =========================================================

urlpatterns = [
    *router.urls,

    # Authentication
    path(
        "login/",
        login
    ),

    path(
        "register/",
        register
    ),

    # Current user
    path(
        "me/",
        me
    ),

    # Pages
    path(
        "pages/<slug:slug>/",
        page
    ),

    # Upload
    path(
        "upload/",
        upload
    ),

    # Users
    path(
        "users/",
        users
    ),

    path(
        "users/<int:pk>/",
        user_edit
    ),

    # Roles
    path(
        "roles/",
        roles
    ),
]