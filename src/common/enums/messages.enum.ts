export enum UserMessages {
  USER_CREATED = 'کاربر با موفقیت ایجاد شد.',
  USER_UPDATED = 'اطلاعات کاربر با موفقیت ویرایش شد.',
  USER_DELETED = 'کاربر با موفقیت حذف شد.',
  USER_NOT_FOUND = 'کاربر موردنظر پیدا نشد.',
  USER_EMAIL_ALREADY_EXISTS = 'این ایمیل قبلاً ثبت شده است.',
  USER_EMAIL_ALREADY_USED = 'این ایمیل قبلاً استفاده شده است.',
}

export enum AuthMessages {
  REGISTER_SUCCESS = 'ثبت‌نام با موفقیت انجام شد.',
  LOGIN_SUCCESS = 'ورود با موفقیت انجام شد.',
  INVALID_CREDENTIALS = 'ایمیل یا رمز عبور اشتباه است.',
  EMAIL_ALREADY_EXISTS = 'این ایمیل قبلاً ثبت شده است.',
  REFRESH_TOKEN_INVALID = 'توکن تمدید اعتبار نامعتبر یا منقضی شده است.',
  LOGOUT_SUCCESS = 'با موفقیت از حساب کاربری خارج شدید.',
}

export enum BusinessMessages {
  BUSINESS_CREATED = 'کسب‌وکار با موفقیت ایجاد شد.',
  BUSINESS_UPDATED = 'اطلاعات کسب‌وکار با موفقیت بروزرسانی شد.',
  BUSINESS_DELETED = 'کسب‌وکار با موفقیت حذف شد.',
  BUSINESS_NOT_FOUND = 'کسب‌وکار موردنظر پیدا نشد.',
}

export enum ServiceMessages {
  SERVICE_CREATED = 'خدمت با موفقیت ایجاد شد.',
  SERVICE_UPDATED = 'اطلاعات خدمت با موفقیت بروزرسانی شد.',
  SERVICE_DELETED = 'خدمت با موفقیت حذف شد.',
  SERVICE_NOT_FOUND = 'خدمت موردنظر پیدا نشد.',
}

export enum AppointmentMessages {
  APPOINTMENT_CREATED = 'نوبت با موفقیت ثبت شد.',
  APPOINTMENT_UPDATED = 'نوبت با موفقیت بروزرسانی شد.',
  APPOINTMENT_CANCELLED = 'نوبت با موفقیت لغو شد.',
  APPOINTMENT_COMPLETED = 'نوبت با موفقیت تکمیل شد.',
  APPOINTMENT_NOT_FOUND = 'نوبت موردنظر پیدا نشد.',
  APPOINTMENT_CONFLICT = 'این بازه زمانی قبلاً رزرو شده است.',
  APPOINTMENT_PAST_DATE = 'امکان ثبت نوبت در زمان گذشته وجود ندارد.',
  SERVICE_NOT_FOUND = 'خدمت موردنظر پیدا نشد.',
  SERVICE_INACTIVE = 'این خدمت در حال حاضر غیرفعال است.',
  INVALID_APPOINTMENT_TIME = 'زمان پایان نوبت باید بعد از زمان شروع باشد.',
}

export enum QueueMessages {
  QUEUE_CREATED = 'مراجعه‌کننده با موفقیت وارد صف شد.',
  QUEUE_UPDATED = 'وضعیت صف با موفقیت بروزرسانی شد.',
  QUEUE_CANCELLED = 'ورودی صف با موفقیت لغو شد.',
  QUEUE_NOT_FOUND = 'ورودی صف موردنظر پیدا نشد.',
  QUEUE_ALREADY_EXISTS = 'این مراجعه‌کننده قبلاً وارد صف شده است.',
  QUEUE_INVALID_STATUS = 'تغییر وضعیت صف امکان‌پذیر نیست.',
  QUEUE_NUMBER_GENERATED = 'شماره صف با موفقیت تولید شد.',
  APPOINTMENT_NOT_FOUND = 'نوبت موردنظر پیدا نشد.',
  APPOINTMENT_ALREADY_QUEUED = 'این نوبت قبلاً وارد صف شده است.',
  BUSINESS_NOT_FOUND = 'کسب‌وکار موردنظر پیدا نشد.',
  USER_NOT_FOUND = 'کاربر موردنظر پیدا نشد.',
}
