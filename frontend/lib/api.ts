import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        const isAuthPage = window.location.pathname === '/login'
        if (!isAuthPage) {
          localStorage.removeItem('token')
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export function extractErrorMessage(err: any): string {
  const data = err?.response?.data
  if (!data) return 'Сервер недоступен. Проверьте, что бэкенд запущен.'
  const msg = data.message
  if (Array.isArray(msg)) return msg.join('. ')
  if (typeof msg === 'string') return msg
  return data.error || 'Произошла ошибка'
}
