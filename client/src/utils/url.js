export const getBackendUrl = (path = '') => {
  // If path is a legacy local certificate upload that no longer exists on ephemeral storage,
  // return fallback static template to prevent 404 console errors
  if (typeof path === 'string' && path.includes('/uploads/certificateImage-')) {
    return '/participation-template.png';
  }

  // Resolve VITE_API_URL dynamically to support local network/mobile access for uploads & proxy
  const envUrl = import.meta.env.VITE_API_URL;
  let baseUrl = '';

  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    baseUrl = envUrl;
  } else {
    // If on local dev/preview server (port is not 5000), target port 5000 on the same host
    if (
      typeof window !== 'undefined' &&
      window.location.port !== "5000" &&
      (window.location.hostname === 'localhost' ||
       window.location.hostname === '127.0.0.1' ||
       window.location.hostname.startsWith('192.168.') ||
       window.location.hostname.startsWith('10.'))
    ) {
      baseUrl = `${window.location.protocol}//${window.location.hostname}:5000`;
    } else {
      baseUrl = '';
    }
  }

  if (!path) {
    return baseUrl;
  }

  // If path is a raw Cloudinary public ID or filename without http prefix (e.g. "vnqoqivjgdvgb4cx60ui.jpg" or "vnqoqivjgdvgb4cx60ui")
  if (typeof path === 'string' && !path.startsWith('http://') && !path.startsWith('https://') && !path.startsWith('/') && !path.startsWith('uploads/') && !path.includes('/uploads/')) {
    if (path.endsWith('.jpg') || path.endsWith('.png') || path.endsWith('.jpeg') || path.endsWith('.webp') || path.length > 15) {
      const fullCloudinaryUrl = `https://res.cloudinary.com/dwyx96tgh/image/upload/${path}`;
      return `${baseUrl}/api/image-proxy?url=${encodeURIComponent(fullCloudinaryUrl)}`;
    }
  }

  // If path is an external URL (e.g. Cloudinary), proxy it through our backend server
  // to serve it as a first-party resource and permanently eliminate Tracking Prevention browser warnings!
  if (typeof path === 'string' && (path.startsWith('http://') || path.startsWith('https://'))) {
    if (path.includes('/api/image-proxy?url=')) return path;
    return `${baseUrl}/api/image-proxy?url=${encodeURIComponent(path)}`;
  }

  // Non-upload paths (static public assets like certificate templates in client/public)
  if (typeof path === 'string' && !path.includes('/uploads/') && !path.startsWith('uploads/')) {
    return path.startsWith('/') ? path : `/${path}`;
  }

  // Remove duplicate slashes
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

export const getApiBaseUrl = () => {
  return getBackendUrl('');
};

export const getEventFallbackImage = (event) => {
  if (!event) return '/wild.jpg';

  const customBg = event.loginBgUrl || event.imageUrl || event.image || event.coverImage;
  if (customBg && typeof customBg === 'string' && customBg.trim() !== '') {
    // If Admin uploaded a custom background image, use it!
    if (!customBg.includes('/wild.jpg') && !customBg.includes('wild.jpg')) {
      return customBg;
    }
  }

  // Pick category-relevant fallback based on event title/eventType/category
  const typeStr = String(event.eventType || event.category || event.title || '').toLowerCase();
  if (typeStr.includes('paint') || typeStr.includes('art') || typeStr.includes('craft') || typeStr.includes('drawing') || typeStr.includes('chitra')) {
    return '/painting.jpeg';
  }

  return '/wild.jpg';
};
