export const getBackendUrl = (path) => {
  if (!path) return '';

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
    // If on Vite dev server (port 5173), request should go to backend at port 5000 on the same host
    if (window.location.port === "5173") {
      baseUrl = `${window.location.protocol}//${window.location.hostname}:5000`;
    } else {
      // Relative URL for same host/port serving
      baseUrl = '';
    }
  }

  // If path is an external URL (e.g. Cloudinary), proxy it through our backend server
  // to serve it as a first-party resource and permanently eliminate Tracking Prevention browser warnings!
  if (path.startsWith('http://') || path.startsWith('https://')) {
    if (path.includes('/api/image-proxy?url=')) return path;
    return `${baseUrl}/api/image-proxy?url=${encodeURIComponent(path)}`;
  }

  // Non-upload paths (static public assets like certificate templates in client/public)
  if (!path.includes('/uploads/') && !path.startsWith('uploads/')) {
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
