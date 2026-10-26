// Client Device and Network Detection Utility
export function getClientDeviceInfo() {
  if (typeof navigator === 'undefined') {
    return {
      device: 'Desktop Browser / Workstation',
      isMobile: false,
      browser: 'Web Browser',
      os: 'Operating System'
    };
  }

  const ua = navigator.userAgent || '';
  
  // OS Detection
  let os = 'Windows';
  if (/iPhone/i.test(ua)) os = 'iOS (iPhone)';
  else if (/iPad/i.test(ua)) os = 'iPadOS (iPad)';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/Macintosh|Mac OS X/i.test(ua)) os = 'macOS';
  else if (/Linux/i.test(ua)) os = 'Linux';
  else if (/Windows NT 10.0|Windows NT 11.0/i.test(ua)) os = 'Windows 11';
  else if (/Windows/i.test(ua)) os = 'Windows';

  // Browser Detection
  let browser = 'Chrome';
  if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) browser = 'Chrome';
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = 'Safari';
  else if (/Firefox\//i.test(ua)) browser = 'Firefox';
  else if (/OPR\//i.test(ua)) browser = 'Opera';

  const isMobile = /iPhone|iPad|iPod|Android/i.test(ua);
  const deviceType = isMobile ? 'Mobile' : 'Desktop';

  return {
    device: `${deviceType} ${browser} / ${os}`,
    isMobile,
    browser,
    os
  };
}

let cachedNetworkInfo = null;

export async function getClientNetworkInfo() {
  if (cachedNetworkInfo) return cachedNetworkInfo;

  // 1. Try ipapi.co (provides IP, City, Region, Country)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2800);
    const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data && data.ip) {
        const city = data.city || '';
        const region = data.region || '';
        const country = data.country_name || data.country || '';
        const locationPart = [city, country].filter(Boolean).join(', ') || region;
        cachedNetworkInfo = {
          ip: data.ip,
          location: locationPart || 'Active Connection',
          display: locationPart ? `${data.ip} (${locationPart})` : `${data.ip} (Active Connection)`
        };
        return cachedNetworkInfo;
      }
    }
  } catch (_) {}

  // 2. Fallback to api.ipify.org
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data && data.ip) {
        cachedNetworkInfo = {
          ip: data.ip,
          location: 'Active Connection',
          display: `${data.ip} (Active Connection)`
        };
        return cachedNetworkInfo;
      }
    }
  } catch (_) {}

  // 3. Fallback for offline / local network
  cachedNetworkInfo = {
    ip: '127.0.0.1',
    location: 'Local Connection',
    display: '127.0.0.1 (Local Session)'
  };
  return cachedNetworkInfo;
}
