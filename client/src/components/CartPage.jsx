import { useEffect, useState } from 'react'
import HomeNav from './HomeNav'
import './CartPage.css'
import { apiFetch } from '../utils/api'

function CartPage({
  onBack,
  onLogin,
  onSignup,
  onLogout,
  onAdmin,
  onNavigateSection,
  onCart,
  onOrders,
  onCheckout,
}) {
  const [userName, setUserName] = useState('')
  const [userType, setUserType] = useState('')
  const [cart, setCart] = useState(null)
  const [status, setStatus] = useState({ type: '', message: '' })
  const [updatingItemId, setUpdatingItemId] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      setUserName('')
      setUserType('')
      setCart(null)
      setStatus({ type: 'error', message: '로그인이 필요합니다.' })
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
          setStatus({ type: 'error', message: '유저 정보를 불러오지 못했습니다.' })
          return
        }
        const payload = await response.json().catch(() => ({}))
        setUserName(payload?.name || '')
        setUserType(payload?.user_type || '')

        if (!payload?._id) {
          setStatus({ type: 'error', message: '유저 정보를 찾을 수 없습니다.' })
          return
        }

        const cartResponse = await apiFetch(`/api/carts/user/${payload._id}`)
        const cartPayload = await cartResponse.json().catch(() => ({}))
        if (!cartResponse.ok) {
          if (cartResponse.status === 404) {
            setCart({ items: [] })
            return
          }
          setStatus({
            type: 'error',
            message: cartPayload.message || '장바구니를 불러오지 못했습니다.',
          })
          return
        }
        setCart(cartPayload)
      } catch (error) {
        setStatus({ type: 'error', message: '네트워크 오류가 발생했습니다.' })
      }
    }

    fetchUser()
  }, [])

  const handleLogout = () => {
    setUserName('')
    setUserType('')
    if (onLogout) {
      onLogout()
    }
  }

  const updateCartItems = async (nextItems, activeItemId) => {
    if (!cart?._id) return
    setUpdatingItemId(activeItemId || '')
    setStatus({ type: '', message: '' })
    try {
      const response = await apiFetch(`/api/carts/${cart._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: cart.user?._id || cart.user,
          items: nextItems.map((item) => ({
            product: item.product?._id || item.product,
            quantity: item.quantity,
            instructorName: item.instructorName,
          })),
        }),
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        setStatus({
          type: 'error',
          message: payload.message || '장바구니 업데이트에 실패했습니다.',
        })
        return
      }
      setCart(payload)
    } catch (error) {
      setStatus({ type: 'error', message: '네트워크 오류가 발생했습니다.' })
    } finally {
      setUpdatingItemId('')
    }
  }

  const handleQuantityChange = (item, delta) => {
    if (!cart?.items) return
    const nextItems = cart.items
      .map((current) => {
        const currentId = current.product?._id || current.product
        const targetId = item.product?._id || item.product
        if (currentId !== targetId) return current
        const nextQty = Math.max((current.quantity || 1) + delta, 1)
        return { ...current, quantity: nextQty }
      })
      .filter(Boolean)
    updateCartItems(nextItems, item.product?._id || item._id)
  }

  const handleRemoveItem = (item) => {
    if (!cart?.items) return
    const targetId = item.product?._id || item.product
    const nextItems = cart.items.filter((current) => {
      const currentId = current.product?._id || current.product
      return currentId !== targetId
    })
    updateCartItems(nextItems, item.product?._id || item._id)
  }

  const totalAmount = cart?.items?.reduce((sum, item) => {
    const price = item.product?.price || 0
    return sum + price * (item.quantity || 1)
  }, 0)

  return (
    <div className="page cart-page">
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
      <main className="container cart-container">
        <button className="secondary back-button" onClick={onBack}>
          돌아가기
        </button>
        <h2>장바구니</h2>
        {status.message && (
          <p className={`status ${status.type}`}>{status.message}</p>
        )}
        {cart && cart.items?.length === 0 && !status.message && (
          <p>장바구니가 비어 있습니다.</p>
        )}
        {cart && cart.items?.length > 0 && (
          <div className="cart-list">
            {cart.items.map((item, index) => (
              <article
                className="cart-item"
                key={`${item.product?._id || item._id || 'item'}-${index}`}
              >
                <div className="cart-item-image">
                  {item.product?.image ? (
                    <img src={item.product.image} alt={item.product.name} />
                  ) : (
                    <div className="cart-item-placeholder">이미지 없음</div>
                  )}
                </div>
                <div className="cart-item-info">
                  <h4>{item.product?.name || '상품명 없음'}</h4>
                  <div className="cart-item-qty">
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => handleQuantityChange(item, -1)}
                      disabled={updatingItemId === (item.product?._id || item._id)}
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => handleQuantityChange(item, 1)}
                      disabled={updatingItemId === (item.product?._id || item._id)}
                    >
                      +
                    </button>
                  </div>
                  {item.instructorName && (
                    <p>선택 강사: {item.instructorName}</p>
                  )}
                  {item.product?.price !== undefined && (
                    <p>가격: {item.product.price.toLocaleString()}원</p>
                  )}
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => handleRemoveItem(item)}
                    disabled={updatingItemId === (item.product?._id || item._id)}
                  >
                    삭제
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
        {cart && cart.items?.length > 0 && (
          <div className="cart-summary">
            <button className="secondary" type="button" onClick={onOrders}>
              주문내역
            </button>
            <span>총 금액</span>
            <strong>{totalAmount?.toLocaleString()}원</strong>
            <button className="primary" type="button" onClick={onCheckout}>
              결제하기
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

export default CartPage
