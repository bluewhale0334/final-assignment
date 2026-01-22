import { useEffect, useState } from 'react'
import HomeNav from './HomeNav'
import './ProductDetailPage.css'
import { apiFetch } from '../utils/api'

function ProductDetailPage({
  productId,
  onBack,
  onLogin,
  onSignup,
  onLogout,
  onAdmin,
  onNavigateSection,
  onCart,
  onOrders,
}) {
  const [product, setProduct] = useState(null)
  const [status, setStatus] = useState({ type: '', message: '' })
  const [userName, setUserName] = useState('')
  const [userType, setUserType] = useState('')
  const [userId, setUserId] = useState('')
  const [isAdding, setIsAdding] = useState(false)

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
        setUserId(payload?._id || '')
      } catch (error) {
        setUserName('')
        setUserType('')
        setUserId('')
      }
    }

    fetchUser()
  }, [])

  useEffect(() => {
    if (!productId) {
      setStatus({ type: 'error', message: '상품 정보를 찾을 수 없습니다.' })
      return
    }

    const fetchProduct = async () => {
      setStatus({ type: '', message: '' })
      try {
        const response = await apiFetch(`/api/products/${productId}`)
        const payload = await response.json().catch(() => ({}))
        if (!response.ok) {
          const message = payload.message || '상품 정보를 불러오지 못했습니다.'
          setStatus({ type: 'error', message })
          return
        }
        setProduct(payload)
      } catch (error) {
        setStatus({ type: 'error', message: '네트워크 오류가 발생했습니다.' })
      }
    }

    fetchProduct()
  }, [productId])

  const handleLogout = () => {
    setUserName('')
    setUserType('')
    setUserId('')
    if (onLogout) {
      onLogout()
    }
  }

  const handleAddToCart = async () => {
    if (!userId) {
      setStatus({ type: 'error', message: '로그인이 필요합니다.' })
      return
    }
    if (!product?._id) {
      setStatus({ type: 'error', message: '상품 정보를 찾을 수 없습니다.' })
      return
    }

    setIsAdding(true)
    setStatus({ type: '', message: '' })

    try {
      const cartResponse = await apiFetch(`/api/carts/user/${userId}`)
      const cartPayload = await cartResponse.json().catch(() => ({}))

      if (cartResponse.ok) {
        const existingItems = Array.isArray(cartPayload.items)
          ? cartPayload.items
          : []
        const nextItems = existingItems.map((item) => {
          if (item.product?.toString?.() === product._id) {
            return { ...item, quantity: (item.quantity || 1) + 1 }
          }
          if (item.product === product._id) {
            return { ...item, quantity: (item.quantity || 1) + 1 }
          }
          return item
        })

        const hasItem = existingItems.some((item) =>
          item.product?.toString?.() === product._id || item.product === product._id
        )
        if (!hasItem) {
          nextItems.push({ product: product._id, quantity: 1 })
        }

        const updateResponse = await apiFetch(`/api/carts/${cartPayload._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user: userId,
            items: nextItems.map((item) => ({
              product: item.product?._id || item.product,
              quantity: item.quantity,
              instructorName: item.instructorName,
            })),
          }),
        })

        if (!updateResponse.ok) {
          const updatePayload = await updateResponse.json().catch(() => ({}))
          setStatus({
            type: 'error',
            message: updatePayload.message || '장바구니 업데이트 실패',
          })
          return
        }

        setStatus({ type: 'success', message: '장바구니에 추가되었습니다.' })
        return
      }

      if (cartResponse.status === 404) {
        const createResponse = await apiFetch('/api/carts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user: userId,
            items: [{ product: product._id, quantity: 1 }],
          }),
        })
        if (!createResponse.ok) {
          const createPayload = await createResponse.json().catch(() => ({}))
          setStatus({
            type: 'error',
            message: createPayload.message || '장바구니 생성 실패',
          })
          return
        }
        setStatus({ type: 'success', message: '장바구니에 추가되었습니다.' })
        return
      }

      setStatus({
        type: 'error',
        message: cartPayload.message || '장바구니를 불러오지 못했습니다.',
      })
    } catch (error) {
      setStatus({ type: 'error', message: '네트워크 오류가 발생했습니다.' })
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="page product-detail-page">
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
      />
      <main className="container product-detail-container">
        <button className="secondary back-button" onClick={onBack}>
          돌아가기
        </button>
        {status.message && (
          <p className={`status ${status.type}`}>{status.message}</p>
        )}
        {product && (
          <div className="product-detail">
            <div className="product-detail-image">
              {product.image ? (
                <img src={product.image} alt={product.name} />
              ) : (
                <div className="product-detail-placeholder">
                  이미지 없음
                </div>
              )}
            </div>
            <div className="product-detail-info">
              <h2>{product.name}</h2>
              <p className="product-detail-price">
                {product.price?.toLocaleString()}원
              </p>
              <div className="product-detail-meta">
                <span>카테고리: {product.category}</span>
                <span>SKU: {product.sku}</span>
              </div>
              <p className="product-detail-description">
                {product.description || '설명이 등록되지 않았습니다.'}
              </p>
              <div className="actions">
                <button className="primary" onClick={handleAddToCart} disabled={isAdding}>
                  {isAdding ? '추가 중...' : '장바구니 추가'}
                </button>
                <button className="secondary">상담 신청</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default ProductDetailPage
