# راه‌اندازی بک‌اند
pip install -r requirements.txt
django-admin startproject config .
python manage.py startapp core   # سپس فایل‌های core را جایگزین کنید

## config/settings.py
INSTALLED_APPS += ["rest_framework","rest_framework.authtoken","corsheaders","core"]
MIDDLEWARE.insert(0,"corsheaders.middleware.CorsMiddleware")
CORS_ALLOW_ALL_ORIGINS = True   # فقط برای توسعه
REST_FRAMEWORK = {"DEFAULT_AUTHENTICATION_CLASSES":["rest_framework.authentication.TokenAuthentication"]}
LANGUAGE_CODE="fa"; TIME_ZONE="Asia/Tehran"

## config/urls.py
path("api/", include("core.api"))

python manage.py makemigrations core && python manage.py migrate && python manage.py runserver

## تنظیمات آپلود تصویر (config/settings.py و config/urls.py)
MEDIA_URL = "/media/"; MEDIA_ROOT = BASE_DIR / "media"
# urls.py:
from django.conf import settings; from django.conf.urls.static import static
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
# بعد از تغییر مدل‌ها: python manage.py makemigrations core && python manage.py migrate
