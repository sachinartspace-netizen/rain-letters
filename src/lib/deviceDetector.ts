/**
 * Comprehensive Device & Hardware Model Detector
 */

export interface DeviceVisitData {
  device_brand: string;
  device_model: string;
  os: string;
  browser: string;
  screen_size: string;
  language: string;
  page_visited: string;
  user_email?: string | null;
  city?: string;
  country?: string;
}

// Map common Samsung model prefixes to consumer friendly names
const parseSamsungModel = (modelStr: string): string => {
  const upper = modelStr.toUpperCase();
  if (upper.startsWith('SM-S928')) return 'Samsung Galaxy S24 Ultra';
  if (upper.startsWith('SM-S926')) return 'Samsung Galaxy S24+';
  if (upper.startsWith('SM-S921')) return 'Samsung Galaxy S24';
  if (upper.startsWith('SM-S918')) return 'Samsung Galaxy S23 Ultra';
  if (upper.startsWith('SM-S916')) return 'Samsung Galaxy S23+';
  if (upper.startsWith('SM-S911')) return 'Samsung Galaxy S23';
  if (upper.startsWith('SM-S908')) return 'Samsung Galaxy S22 Ultra';
  if (upper.startsWith('SM-A5')) return `Samsung Galaxy A5x (${modelStr})`;
  if (upper.startsWith('SM-A3')) return `Samsung Galaxy A3x (${modelStr})`;
  if (upper.startsWith('SM-M')) return `Samsung Galaxy M-series (${modelStr})`;
  if (upper.startsWith('SM-F')) return `Samsung Galaxy Z Fold/Flip (${modelStr})`;
  return `Samsung Galaxy (${modelStr})`;
};

export async function detectDeviceInfo(pageVisited = '/', userEmail?: string | null): Promise<DeviceVisitData> {
  const ua = navigator.userAgent || '';
  const screen_size = `${window.screen.width}x${window.screen.height}`;
  const language = navigator.language || 'en';

  let device_brand = 'Unknown';
  let device_model = 'Generic Device';
  let os = 'Unknown OS';
  let browser = 'Unknown Browser';

  // 1. Check navigator.userAgentData (Modern Client Hints API - Chrome / Edge / Opera / Android)
  const navAny = navigator as any;
  if (navAny.userAgentData && typeof navAny.userAgentData.getHighEntropyValues === 'function') {
    try {
      const hints = await navAny.userAgentData.getHighEntropyValues([
        'model',
        'platform',
        'platformVersion',
        'brands'
      ]);

      if (hints.model && hints.model.trim() !== '') {
        device_model = hints.model.trim();
      }
      if (hints.platform) {
        os = hints.platform;
        if (hints.platformVersion) os += ` (v${hints.platformVersion})`;
      }
    } catch {
      // Fallback to UA parsing
    }
  }

  // 2. Parse User Agent for OS and Device Model if not fully resolved
  if (device_model === 'Generic Device') {
    if (/iPhone/i.test(ua)) {
      device_brand = 'Apple';
      device_model = 'Apple iPhone';
      os = 'iOS';
      const iosMatch = ua.match(/OS (\d+[_\d]*)/);
      if (iosMatch) os = `iOS ${iosMatch[1].replace(/_/g, '.')}`;
    } else if (/iPad/i.test(ua)) {
      device_brand = 'Apple';
      device_model = 'Apple iPad';
      os = 'iPadOS';
    } else if (/Macintosh|Mac OS X/i.test(ua)) {
      device_brand = 'Apple';
      device_model = 'Apple Mac / MacBook';
      os = 'macOS';
      const macMatch = ua.match(/Mac OS X (\d+[_\d]*)/);
      if (macMatch) os = `macOS ${macMatch[1].replace(/_/g, '.')}`;
    } else if (/Windows NT/i.test(ua)) {
      device_brand = 'Microsoft / PC';
      device_model = 'Windows PC';
      if (/Windows NT 10.0/i.test(ua)) os = 'Windows 10/11';
      else if (/Windows NT 6.3/i.test(ua)) os = 'Windows 8.1';
      else if (/Windows NT 6.1/i.test(ua)) os = 'Windows 7';
      else os = 'Windows';
    } else if (/Android/i.test(ua)) {
      device_brand = 'Android';
      const androidMatch = ua.match(/Android\s+([0-9.]+)/i);
      os = androidMatch ? `Android ${androidMatch[1]}` : 'Android';

      // Extract device model from Android UA: e.g. "Android 14; motorola edge 50 fusion Build/..."
      const match = ua.match(/;\s*([^;]+?)\s*(?:Build\/|\))/i);
      if (match && match[1]) {
        device_model = match[1].trim();
      }
    } else if (/Linux/i.test(ua)) {
      device_brand = 'Linux';
      device_model = 'Linux PC';
      os = 'Linux';
    }
  }

  // 3. Resolve Brand from Device Model
  const lowerModel = device_model.toLowerCase();
  if (lowerModel.includes('motorola') || lowerModel.includes('moto')) {
    device_brand = 'Motorola';
  } else if (lowerModel.startsWith('sm-') || lowerModel.includes('samsung') || lowerModel.includes('galaxy')) {
    device_brand = 'Samsung';
    device_model = parseSamsungModel(device_model);
  } else if (lowerModel.includes('pixel')) {
    device_brand = 'Google';
  } else if (lowerModel.includes('redmi') || lowerModel.includes('xiaomi') || lowerModel.includes('poco') || lowerModel.startsWith('22') || lowerModel.startsWith('23')) {
    device_brand = 'Xiaomi / Redmi';
  } else if (lowerModel.includes('oneplus') || lowerModel.startsWith('cph') || lowerModel.startsWith('op')) {
    device_brand = 'OnePlus / Oppo';
  } else if (lowerModel.includes('vivo') || lowerModel.startsWith('v2')) {
    device_brand = 'Vivo';
  } else if (lowerModel.includes('realme') || lowerModel.startsWith('rmx')) {
    device_brand = 'Realme';
  }

  // 4. Browser Detection
  if (/Edg\//i.test(ua)) browser = 'Microsoft Edge';
  else if (/Chrome\//i.test(ua) && !/Edg/i.test(ua)) browser = 'Google Chrome';
  else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browser = 'Apple Safari';
  else if (/Firefox\//i.test(ua)) browser = 'Mozilla Firefox';
  else if (/SamsungBrowser/i.test(ua)) browser = 'Samsung Internet';

  // 5. Fetch City & Country (Optional, lightweight fallback)
  let city: string | undefined;
  let country: string | undefined;

  try {
    const geoRes = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(2000) });
    if (geoRes.ok) {
      const geo = await geoRes.json();
      if (geo.city) city = geo.city;
      if (geo.country_name) country = geo.country_name;
    }
  } catch {
    // Non-blocking
  }

  return {
    device_brand,
    device_model,
    os,
    browser,
    screen_size,
    language,
    page_visited: pageVisited,
    user_email: userEmail || null,
    city,
    country,
  };
}
