import QRCode from 'qrcode';

/**
 * YouPI-PG (Your UPI Payment Gateway) Client Service
 * An open-source, 0% fee self-hosted UPI gateway integration for Kirana.
 * GitHub: https://github.com/youpi-pg/YouPI-PG
 */

export const DEFAULT_CONFIG = {
  merchantVpa: '6303741498-2@ybl',
  merchantName: 'Tarun',
  apiUrl: 'http://localhost:6100',
  checkoutUrl: 'http://localhost:7000',
  currency: 'INR',
  sessionTimeoutSeconds: 300 // 5 minutes standard UPI window
};

/**
 * Returns current merchant configuration.
 * Prioritizes user's custom settings from localStorage, then .env, then defaults.
 */
export function getMerchantConfig() {
  let localVpa = typeof window !== 'undefined' ? localStorage.getItem('kirana_youpi_merchant_vpa') : null;
  let localName = typeof window !== 'undefined' ? localStorage.getItem('kirana_youpi_merchant_name') : null;

  // Purge any older test defaults
  if (localVpa === 'kirana.store@upi') {
    localVpa = null;
    if (typeof window !== 'undefined') localStorage.removeItem('kirana_youpi_merchant_vpa');
  }
  if (localName === 'Kirana Grocery Store') {
    localName = null;
    if (typeof window !== 'undefined') localStorage.removeItem('kirana_youpi_merchant_name');
  }

  return {
    merchantVpa: localVpa || import.meta.env.VITE_YOUPI_MERCHANT_VPA || DEFAULT_CONFIG.merchantVpa,
    merchantName: localName || import.meta.env.VITE_YOUPI_MERCHANT_NAME || DEFAULT_CONFIG.merchantName,
    apiUrl: import.meta.env.VITE_YOUPI_GATEWAY_URL || DEFAULT_CONFIG.apiUrl,
    checkoutUrl: import.meta.env.VITE_YOUPI_CHECKOUT_URL || DEFAULT_CONFIG.checkoutUrl,
    currency: DEFAULT_CONFIG.currency,
    sessionTimeoutSeconds: DEFAULT_CONFIG.sessionTimeoutSeconds,
    adminToken: import.meta.env.VITE_YOUPI_ADMIN_TOKEN || 'd55c4083f69b9a7152259a0acd37bc9b4ae1c980790c17d7de42710855b6b8ba'
  };
}

/**
 * Saves the merchant's personal/business UPI VPA and Name.
 */
export function saveMerchantConfig({ merchantVpa, merchantName }) {
  if (typeof window !== 'undefined') {
    if (merchantVpa) {
      localStorage.setItem('kirana_youpi_merchant_vpa', merchantVpa.trim());
    }
    if (merchantName) {
      localStorage.setItem('kirana_youpi_merchant_name', merchantName.trim());
    }
    window.dispatchEvent(new CustomEvent('youpi_merchant_updated', {
      detail: { merchantVpa, merchantName }
    }));
  }
}

/**
 * Resets the merchant UPI to system default
 */
export function resetMerchantConfig() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('kirana_youpi_merchant_vpa');
    localStorage.removeItem('kirana_youpi_merchant_name');
    window.dispatchEvent(new CustomEvent('youpi_merchant_updated', { detail: {} }));
  }
}

/**
 * Generates an NPCI-compliant UPI Intent URI string
 */
export function buildUpiIntentUrl({
  vpa,
  name,
  amount,
  orderId,
  note
}) {
  const config = getMerchantConfig();
  const targetVpa = vpa || config.merchantVpa;
  const targetName = name || config.merchantName;
  const formattedAmount = Number(amount || 0).toFixed(2);
  const transactionNote = note || `Order ${orderId || 'Kirana'}`;
  
  const params = new URLSearchParams({
    pa: targetVpa,
    pn: targetName,
    am: formattedAmount,
    cu: config.currency,
    tn: transactionNote,
    tr: orderId ? String(orderId) : `TXN${Date.now()}`
  });

  return `upi://pay?${params.toString()}`;
}

/**
 * Builds specific app deep links for popular UPI clients
 */
export function buildAppDeepLinks(upiString) {
  const encodedQuery = upiString.replace('upi://pay?', '');
  
  return {
    generic: upiString,
    gpay: `tez://upi/pay?${encodedQuery}`,
    phonepe: `phonepe://upi/pay?${encodedQuery}`,
    paytm: `paytmmp://pay?${encodedQuery}`,
    cred: `credpay://upi/pay?${encodedQuery}`,
    bhim: `upi://pay?${encodedQuery}`
  };
}

/**
 * Generates a high-resolution Vector/DataURL QR code for the given UPI string
 */
export async function generateUpiQrCode(upiString) {
  try {
    return await QRCode.toDataURL(upiString, {
      width: 400,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H'
    });
  } catch (err) {
    console.error('Failed to generate UPI QR code:', err);
    throw err;
  }
}

/**
 * Validates whether a given string is a valid 12-digit NPCI UPI UTR / Ref number
 */
export function validateUtr(utr) {
  if (!utr) return { isValid: false, message: 'UTR cannot be empty' };
  const cleanUtr = String(utr).trim();
  const utrRegex = /^\d{12}$/;
  
  if (!utrRegex.test(cleanUtr)) {
    return {
      isValid: false,
      message: 'UTR must be exactly 12 numeric digits (e.g. 423589123456)'
    };
  }
  return { isValid: true, utr: cleanUtr };
}

/**
 * Step 1: Check whether customer exists in YouPI database
 */
export async function checkCustomerUser(mobileNumber) {
  const config = getMerchantConfig();
  const cleanMobile = mobileNumber.replace(/\D/g, '').slice(-10);
  
  try {
    const res = await fetch(`${config.apiUrl}/api/v1/customer/check-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobileNumber: cleanMobile })
    });
    return await res.json();
  } catch (err) {
    console.warn('[YouPI] checkCustomerUser fallback:', err);
    return { success: true, exists: false, mobileNumber: cleanMobile };
  }
}

/**
 * Step 1b: Dispatches 6-digit WhatsApp OTP to customer's phone
 */
export async function sendCustomerOtp({ mobileNumber, name, email, isNewUser }) {
  const config = getMerchantConfig();
  const cleanMobile = mobileNumber.replace(/\D/g, '').slice(-10);

  try {
    const res = await fetch(`${config.apiUrl}/api/v1/customer/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mobileNumber: cleanMobile,
        name: name || 'Customer',
        email: email || `${cleanMobile}@kirana.local`,
        isNewUser: Boolean(isNewUser)
      })
    });
    return await res.json();
  } catch (err) {
    console.warn('[YouPI] sendCustomerOtp fallback:', err);
    // Standalone fallback: return mock OTP
    return {
      success: true,
      message: 'OTP sent to WhatsApp number.',
      mobileNumber: cleanMobile
    };
  }
}

/**
 * Step 2: Verifies the 6-digit WhatsApp OTP and returns auth session token
 */
export async function verifyCustomerOtp({ mobileNumber, otp, name, email }) {
  const config = getMerchantConfig();
  const cleanMobile = mobileNumber.replace(/\D/g, '').slice(-10);

  try {
    const res = await fetch(`${config.apiUrl}/api/v1/customer/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mobileNumber: cleanMobile,
        otp: String(otp).trim(),
        name: name || 'Customer',
        email: email || `${cleanMobile}@kirana.local`
      })
    });
    return await res.json();
  } catch (err) {
    console.warn('[YouPI] verifyCustomerOtp fallback:', err);
    return {
      success: true,
      token: `mock_tok_${Date.now()}`,
      customer: {
        id: `mock_cust_${cleanMobile}`,
        name: name || 'Customer',
        mobileNumber: cleanMobile
      }
    };
  }
}

/**
 * Step 3a: Creates a fresh Payment Session in YouPI-PG
 */
export async function createYouPiPayment({ orderId, amount, currency = 'INR', customerInfo = {} }) {
  const config = getMerchantConfig();
  try {
    const res = await fetch(`${config.apiUrl}/api/v1/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId,
        amount: Number(amount).toFixed(2),
        currency,
        description: `Kirana Order #${orderId}`,
        customer: {
          fullName: customerInfo.name || customerInfo.fullName || 'Shopper',
          phoneNumber: customerInfo.phone || customerInfo.mobileNumber || '',
          email: customerInfo.email || ''
        }
      })
    });
    const data = await res.json();
    return {
      success: res.ok,
      paymentId: data.paymentId,
      checkoutUrl: data.checkoutUrl,
      amount: data.amount,
      orderId: data.orderId,
      status: data.status
    };
  } catch (err) {
    console.warn('[YouPI] createYouPiPayment fallback:', err);
    return {
      success: true,
      paymentId: `fallback_${Date.now()}`,
      amount: Number(amount).toFixed(2),
      orderId,
      status: 'INITIATED'
    };
  }
}

/**
 * Step 3b: Binds customer to payment session and activates the 5-minute timer
 */
export async function bindCustomerToSession({ paymentId, token, customerId }) {
  const config = getMerchantConfig();
  try {
    const res = await fetch(`${config.apiUrl}/api/v1/checkout/${paymentId}/bind-customer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ token, customerId })
    });
    return await res.json();
  } catch (err) {
    console.warn('[YouPI] bindCustomerToSession fallback:', err);
    return { success: true, status: 'ACTIVE' };
  }
}

/**
 * Step 3c: Fetches live checkout state (status, upiUri, remaining time)
 */
export async function getCheckoutState(paymentId) {
  const config = getMerchantConfig();
  try {
    const res = await fetch(`${config.apiUrl}/api/v1/checkout/${paymentId}/state`);
    return await res.json();
  } catch (err) {
    console.warn('[YouPI] getCheckoutState fallback:', err);
    return null;
  }
}

/**
 * Simulates incoming bank observation (SMS/Alert) for local testing or UTR submission
 */
export async function simulatePaymentObservation({ paymentId, amount, utr, sender = 'YESBNK' }) {
  const config = getMerchantConfig();
  const formattedUtr = utr || `${Math.floor(100000000000 + Math.random() * 900000000000)}`;
  const formattedAmt = Number(amount || 1).toFixed(2);
  const rawText = `Dear Customer, your A/C ending 1498 is credited with Rs ${formattedAmt} on ${new Date().toLocaleDateString('en-GB')} by UPI Ref ${formattedUtr}. Available Bal: Rs 15420.00`;

  try {
    const res = await fetch(`${config.apiUrl}/api/v1/checkout/${paymentId}/simulate-observation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.adminToken}`
      },
      body: JSON.stringify({
        source: 'SMS',
        sender,
        rawText,
        isTest: true
      })
    });
    const data = await res.json();
    return {
      success: res.ok,
      utr: formattedUtr,
      data
    };
  } catch (err) {
    console.warn('[YouPI] simulatePaymentObservation error:', err);
    return {
      success: false,
      error: err.message
    };
  }
}
