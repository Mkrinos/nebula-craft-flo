import { useState, useEffect } from 'react';

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isSafari: boolean;
  isChrome: boolean;
  isFirefox: boolean;
  isStandalone: boolean; // PWA mode
  orientation: 'portrait' | 'landscape';
  screenWidth: number;
  screenHeight: number;
  safeAreaInsets: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

export function useDeviceDetection(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => getDeviceInfo());

  useEffect(() => {
    const handleResize = () => {
      setDeviceInfo(getDeviceInfo());
    };

    const handleOrientationChange = () => {
      // Small delay to ensure accurate dimensions after orientation change
      setTimeout(() => {
        setDeviceInfo(getDeviceInfo());
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Listen for safe area changes (e.g., keyboard appearing on mobile)
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      mediaQuery.removeEventListener('change', handleResize);
    };
  }, []);

  return deviceInfo;
}

function getDeviceInfo(): DeviceInfo {
  if (typeof window === 'undefined') {
    return getDefaultDeviceInfo();
  }

  const ua = navigator.userAgent.toLowerCase();
  const uaFull = navigator.userAgent; // Keep original case for some checks
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  
  // Comprehensive mobile detection - covers all Android versions and manufacturers
  const isMobileUA = /mobile|iphone|ipod|windows phone|blackberry|bb10|webos|opera mini|opera mobi|iemobile|wpdesktop/i.test(ua) ||
    // Android mobile (has "mobile" in UA)
    (/android/i.test(ua) && /mobile/i.test(ua)) ||
    // Samsung, Huawei, Xiaomi, Oppo, Vivo, OnePlus, etc.
    /samsung|sm-|huawei|xiaomi|redmi|oppo|vivo|oneplus|realme|poco|nokia|motorola|lg-|htc|zte|lenovo|meizu|honor/i.test(ua);
  
  // Comprehensive tablet detection
  const isTabletUA = /ipad|kindle|silk|playbook|nexus 7|nexus 9|nexus 10|sm-t|gt-p|gt-n|mediapad|matepad|tab/i.test(ua) ||
    // Android tablet (no "mobile" in UA but has android)
    (/android/i.test(ua) && !/mobile/i.test(ua));
  
  // Size-based detection as fallback
  const isMobileSize = screenWidth < MOBILE_BREAKPOINT;
  const isTabletSize = screenWidth >= MOBILE_BREAKPOINT && screenWidth < TABLET_BREAKPOINT;
  
  // Combined detection: UA takes priority, then size fallback
  const isMobile = isMobileUA || (!isTabletUA && isMobileSize);
  const isTablet = isTabletUA || (!isMobile && isTabletSize);
  const isDesktop = !isMobile && !isTablet;
  
  // Touch detection - comprehensive check
  const isTouchDevice = 'ontouchstart' in window || 
    navigator.maxTouchPoints > 0 || 
    (navigator as any).msMaxTouchPoints > 0 ||
    window.matchMedia('(pointer: coarse)').matches;
  
  // iOS detection - covers all iPhones and iPads including iPadOS
  const isIOS = /iphone|ipad|ipod/.test(ua) || 
    // iPad with iPadOS (reports as Mac but has touch)
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ||
    // Webview on iOS
    /\(ip.*applewebkit(?!.*version)/i.test(uaFull);
  
  // Android detection - covers all versions
  const isAndroid = /android/i.test(ua);
  
  // Browser detection
  const isSafari = /safari/.test(ua) && !/chrome|chromium|crios|fxios|edg/.test(ua);
  const isChrome = /chrome|chromium|crios/i.test(ua) && !/edge|edg|opr\//i.test(ua);
  const isFirefox = /firefox|fxios/i.test(ua);
  
  // PWA/Standalone mode - check multiple methods
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    document.referrer.includes('android-app://');
  
  // Orientation - use screen orientation API when available
  const orientation: 'portrait' | 'landscape' = 
    (screen.orientation?.type?.includes('portrait')) ? 'portrait' :
    (screen.orientation?.type?.includes('landscape')) ? 'landscape' :
    (screenHeight > screenWidth ? 'portrait' : 'landscape');
  
  // Safe area insets (CSS env values)
  const safeAreaInsets = getSafeAreaInsets();

  return {
    isMobile,
    isTablet,
    isDesktop,
    isTouchDevice,
    isIOS,
    isAndroid,
    isSafari,
    isChrome,
    isFirefox,
    isStandalone,
    orientation,
    screenWidth,
    screenHeight,
    safeAreaInsets,
  };
}

function getSafeAreaInsets() {
  if (typeof window === 'undefined' || typeof getComputedStyle === 'undefined') {
    return { top: 0, bottom: 0, left: 0, right: 0 };
  }

  const style = getComputedStyle(document.documentElement);
  
  return {
    top: parseInt(style.getPropertyValue('--sat') || '0', 10) || 0,
    bottom: parseInt(style.getPropertyValue('--sab') || '0', 10) || 0,
    left: parseInt(style.getPropertyValue('--sal') || '0', 10) || 0,
    right: parseInt(style.getPropertyValue('--sar') || '0', 10) || 0,
  };
}

function getDefaultDeviceInfo(): DeviceInfo {
  return {
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isTouchDevice: false,
    isIOS: false,
    isAndroid: false,
    isSafari: false,
    isChrome: false,
    isFirefox: false,
    isStandalone: false,
    orientation: 'landscape',
    screenWidth: 1920,
    screenHeight: 1080,
    safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 },
  };
}
