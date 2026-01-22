import { useEffect, useState } from 'react'
import HomeNav from './HomeNav'
import { apiFetch } from '../utils/api'

const initialForm = {
  sku: '',
  name: '',
  price: '',
  category: 'HappyHour',
  image: '',
  description: '',
}

function ProductCreatePage({
  onBack,
  onLogin,
  onSignup,
  onLogout,
  onAdmin,
  onNavigateSection,
  onCart,
  onOrders,
}) {
  const [form, setForm] = useState(initialForm)
  const [status, setStatus] = useState({ type: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userName, setUserName] = useState('')
  const [userType, setUserType] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [isWidgetReady, setIsWidgetReady] = useState(false)
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      setUserName('')
      setUserType('')
      return
    }

    const fetchUser = async () => {
      try {
        const response = await apiFetch('/api/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!response.ok) {
          setUserName('')
          setUserType('')
          return
        }
        const payload = await response.json().catch(() => ({}))
        setUserName(payload?.name || '')
        setUserType(payload?.user_type || '')
      } catch (error) {
        setUserName('')
        setUserType('')
      }
    }

    fetchUser()
  }, [])

  useEffect(() => {
    if (window.cloudinary) {
      setIsWidgetReady(true)
      return
    }

    const existing = document.getElementById('cloudinary-widget')
    if (existing) {
      existing.addEventListener('load', () => setIsWidgetReady(true))
      return
    }

    const script = document.createElement('script')
    script.id = 'cloudinary-widget'
    script.src = 'https://widget.cloudinary.com/v2.0/global/all.js'
    script.async = true
    script.onload = () => setIsWidgetReady(true)
    document.body.appendChild(script)

    return () => {
      script.onload = null
    }
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setStatus({ type: '', message: '' })

    try {
      const payload = {
        ...form,
        price: Number(form.price),
      }

      const response = await apiFetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        const message = result.message || '상품 등록에 실패했습니다.'
        setStatus({ type: 'error', message })
        return
      }

      setStatus({ type: 'success', message: '상품이 등록되었습니다.' })
      setForm(initialForm)
    } catch (error) {
      setStatus({ type: 'error', message: '네트워크 오류가 발생했습니다.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenWidget = () => {
    if (!window.cloudinary || !cloudName || !uploadPreset) {
      setStatus({
        type: 'error',
        message: 'Cloudinary 설정이 필요합니다.',
      })
      return
    }

    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName,
        uploadPreset,
        sources: ['local', 'url', 'camera'],
        multiple: false,
        cropping: false,
      },
      (error, result) => {
        if (error) {
          setStatus({
            type: 'error',
            message: '이미지 업로드에 실패했습니다.',
          })
          return
        }

        if (result?.event === 'success') {
          const imageUrl = result.info?.secure_url || ''
          setForm((prev) => ({ ...prev, image: imageUrl }))
          setPreviewUrl(imageUrl)
        }
      }
    )

    widget.open()
  }

  const handleLogout = () => {
    setUserName('')
    setUserType('')
    if (onLogout) {
      onLogout()
    }
  }

  return (
    <div className="page">
      <HomeNav
        userName={userName}
        userType={userType}
        onLogin={onLogin}
        onSignup={onSignup}
        onLogout={handleLogout}
        onAdmin={onAdmin}
        onNavigateSection={onNavigateSection}
        onCart={onCart}
        onOrders={onOrders}
        isAdminPage
        onAdminBack={onBack}
      />
      <main className="container">
        <h2>PT 상품 추가</h2>
        <form className="form" onSubmit={handleSubmit}>
          <label className="field">
            SKU*
            <input
              type="text"
              name="sku"
              value={form.sku}
              onChange={handleChange}
              required
            />
          </label>

          <label className="field">
            상품 이름*
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </label>

          <label className="field">
            상품 가격*
            <input
              type="number"
              name="price"
              value={form.price}
              onChange={handleChange}
              min="0"
              required
            />
          </label>

          <label className="field">
            카테고리*
            <select name="category" value={form.category} onChange={handleChange}>
              <option value="HappyHour">HappyHour</option>
              <option value="일반 PT">일반 PT</option>
            </select>
          </label>

          <label className="field">
            이미지 URL*
            <input
              type="text"
              name="image"
              value={form.image}
              onChange={handleChange}
              required
            />
            <div className="actions">
              <button
                type="button"
                className="secondary"
                onClick={handleOpenWidget}
                disabled={!isWidgetReady}
              >
                {isWidgetReady ? '이미지 업로드' : '위젯 로딩 중...'}
              </button>
            </div>
          </label>

          {previewUrl && (
            <div className="image-preview">
              <img src={previewUrl} alt="업로드 미리보기" />
            </div>
          )}

          <label className="field">
            설명
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows="3"
            />
          </label>

          {status.message && (
            <p className={`status ${status.type}`}>{status.message}</p>
          )}

          <div className="actions">
            <button type="button" className="secondary" onClick={onBack}>
              돌아가기
            </button>
            <button className="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? '등록 중...' : '상품 등록'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}

export default ProductCreatePage
