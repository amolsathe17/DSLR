export const getBackendUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;

  // Non-upload paths (static public assets like certificate templates in client/public)
  if (!path.includes('/uploads/') && !path.startsWith('uploads/')) {
    return path.startsWith('/') ? path : `/${path}`;
  }

  // Resolve VITE_API_URL dynamically to support local network/mobile access for uploads
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

  // Remove duplicate slashes
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

export const getApiBaseUrl = () => {
  return getBackendUrl('');
};
