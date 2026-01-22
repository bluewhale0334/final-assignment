export const getApiBase = () => {
  return import.meta.env.VITE_API_BASE || ''
}

export const apiFetch = (path, options) => {
  const base = getApiBase()
  return fetch(`${base}${path}`, options)
}
