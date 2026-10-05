# سامانه شرکت هوشمند فناوران برتر ایرانیان (Django + React)

## اجرای بک‌اند
cd backend
python -m venv venv && source venv/bin/activate      # ویندوز: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser                      # مدیر کل
python manage.py runserver                            # http://127.0.0.1:8000

## اجرای فرانت‌اند (ترمینال دوم)
cd frontend
npm install
npm run dev                                           # http://localhost:5173

## ورود
با کاربر مدیر در /panel وارد شوید؛ ویرایش صفحات و مدیریت کاربران در منوی کناری است.
نقش‌های جدید: http://127.0.0.1:8000/admin بخش Role (دسترسی‌ها: tickets, pages, users)

## انتشار
متغیرهای محیطی: DEBUG=0، SECRET_KEY، ALLOWED_HOSTS، CORS_ORIGINS
آدرس API در frontend/src/api.js تنظیم شود. از gunicorn + Nginx + HTTPS استفاده کنید.
