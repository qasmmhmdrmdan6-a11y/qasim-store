// Central bilingual dictionary for static UI strings.
// Store-authored content (product names, hero text, announcement bar, etc.)
// lives in the database with *_ar / *_en columns — NOT here. This file only
// covers fixed interface chrome (buttons, labels, nav, statuses).

export const dictionary = {
  ar: {
    nav: {
      home: 'الرئيسية',
      products: 'المنتجات',
      categories: 'التصنيفات',
      search: 'بحث',
      cart: 'السلة',
    },
    common: {
      addToCart: 'أضف إلى السلة',
      outOfStock: 'غير متوفر حاليًا',
      lowStock: 'الكمية محدودة',
      viewAll: 'عرض الكل',
      loading: 'جاري التحميل...',
      currency: 'ج.م',
      egyptianPound: 'جنيه مصري',
    },
    checkout: {
      guestCheckout: 'إتمام الطلب كزائر',
      fullName: 'الاسم بالكامل',
      phone: 'رقم الهاتف',
      governorate: 'المحافظة',
      address: 'العنوان بالتفصيل',
      notes: 'ملاحظات (اختياري)',
      subtotal: 'الإجمالي الفرعي',
      shipping: 'الشحن',
      total: 'الإجمالي',
      placeOrder: 'تأكيد الطلب',
    },
    orderStatus: {
      new: 'طلب جديد',
      confirmed: 'تم التأكيد',
      preparing: 'قيد التجهيز',
      shipped: 'تم الشحن',
      delivered: 'تم التسليم',
      cancelled: 'تم الإلغاء',
    },
    paymentStatus: {
      pendingReview: 'في انتظار المراجعة',
      paid: 'تم الدفع',
      rejected: 'مرفوض',
      cashOnDelivery: 'الدفع عند الاستلام',
    },
  },
  en: {
    nav: {
      home: 'Home',
      products: 'Products',
      categories: 'Categories',
      search: 'Search',
      cart: 'Cart',
    },
    common: {
      addToCart: 'Add to Cart',
      outOfStock: 'Currently Unavailable',
      lowStock: 'Limited Stock',
      viewAll: 'View All',
      loading: 'Loading...',
      currency: 'EGP',
      egyptianPound: 'Egyptian Pound',
    },
    checkout: {
      guestCheckout: 'Guest Checkout',
      fullName: 'Full Name',
      phone: 'Phone Number',
      governorate: 'Governorate',
      address: 'Detailed Address',
      notes: 'Notes (optional)',
      subtotal: 'Subtotal',
      shipping: 'Shipping',
      total: 'Total',
      placeOrder: 'Place Order',
    },
    orderStatus: {
      new: 'New Order',
      confirmed: 'Confirmed',
      preparing: 'Preparing',
      shipped: 'Shipped',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    },
    paymentStatus: {
      pendingReview: 'Pending Review',
      paid: 'Paid',
      rejected: 'Rejected',
      cashOnDelivery: 'Cash on Delivery',
    },
  },
} as const;

export type Locale = keyof typeof dictionary;
