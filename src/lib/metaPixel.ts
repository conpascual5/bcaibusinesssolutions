declare const fbq: any;

export function trackPageView() {
  if (typeof fbq !== 'undefined') {
    fbq('track', 'PageView');
  }
}

export function trackEvent(eventName: string, params?: Record<string, any>) {
  if (typeof fbq !== 'undefined') {
    fbq('track', eventName, params);
  }
}

export function trackCustomEvent(eventName: string, params?: Record<string, any>) {
  if (typeof fbq !== 'undefined') {
    fbq('trackCustom', eventName, params);
  }
}
