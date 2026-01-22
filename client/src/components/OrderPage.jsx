import { useEffect, useMemo, useState } from 'react'
import HomeNav from './HomeNav'
import './OrderPage.css'
import { apiFetch } from '../utils/api'

function OrderPage({
  onBack,
  onLogin,
  onSignup,
  onLogout,
  onAdmin,
  onNavigateSection,
  onCart,
  onComplete,
  onOrders,
}) {
  const [user, setUser] = useState(null)
  const [cart, setCart] = useState(null)
  const [note, setNote] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [transactionId, setTransactionId] = useState('')
  const [status, setStatus] = useState({ type: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderId, setOrderId] = useState('')

  useEffect(() => {
    if (window.IMP && typeof window.IMP.init === 'function') {
      window.IMP.init('imp07603786')
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      setStatus({ type: 'error', message: '로그인이 필요합니다.' })
      return
    }

    const fetchData = async () => {
      try {
        const response = await apiFetch('/api/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!response.ok) {
          setStatus({ type: 'error', message: '유저 정보를 불러오지 못했습니다.' })
          return
        }
        const payload = await response.json().catch(() => ({}))
        if (!payload?._id) {
          setStatus({ type: 'error', message: '유저 정보를 찾을 수 없습니다.' })
          return
        }
        setUser(payload)

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

    fetchData()
  }, [])

  const orderItems = useMemo(() => {
    if (!cart?.items?.length) return []
    return cart.items.map((item) => {
      const product = item.product || {}
      return {
        product: product._id || item.product,
        quantity: item.quantity || 1,
        productSnapshot: {
          sku: product.sku || '',
          name: product.name || '',
          price: product.price ?? 0,
          category: product.category || '',
          image: product.image || '',
          instructorName: item.instructorName || '',
        },
      }
    })
  }, [cart])

  const totalAmount = useMemo(() => {
    return orderItems.reduce((sum, item) => {
      const price = Number(item.productSnapshot.price) || 0
      return sum + price * (item.quantity || 1)
    }, 0)
  }, [orderItems])

  const handleLogout = () => {
    setUser(null)
    if (onLogout) {
      onLogout()
    }
  }

  const handleSubmitOrder = async () => {
    if (!user?._id) {
      setStatus({ type: 'error', message: '유저 정보를 찾을 수 없습니다.' })
      return
    }
    if (!orderItems.length) {
      setStatus({ type: 'error', message: '주문할 상품이 없습니다.' })
      return
    }
    if (!window.IMP || typeof window.IMP.request_pay !== 'function') {
      setStatus({ type: 'error', message: '결제 모듈을 불러오지 못했습니다.' })
      return
    }

    setIsSubmitting(true)
    setStatus({ type: '', message: '' })
    try {
      const inicisPg = import.meta.env.VITE_PORTONE_PG_INICIS || 'html5_inicis'
      const paymentConfigByMethod = {
        카드결제: { pg: inicisPg, pay_method: 'card' },
        계좌이체: { pg: inicisPg, pay_method: 'trans' },
        카카오페이: {
          pg: import.meta.env.VITE_PORTONE_PG_KAKAOPAY || '',
          pay_method: 'card',
        },
        네이버페이: {
          pg: import.meta.env.VITE_PORTONE_PG_NAVERPAY || '',
          pay_method: 'card',
        },
      }

      const selectedPayment = paymentConfigByMethod[paymentMethod.trim()]
      if (!selectedPayment) {
        setStatus({ type: 'error', message: '결제 방식을 선택해주세요.' })
        return
      }
      if (!selectedPayment.pg) {
        setStatus({
          type: 'error',
          message: '선택한 결제 방식의 PG 채널이 설정되지 않았습니다.',
        })
        return
      }

      const merchantUid = `order_${Date.now()}`
      const productName =
        orderItems[0]?.productSnapshot?.name || '주문 상품'

      const paymentResult = await new Promise((resolve) => {
        window.IMP.request_pay(
          {
            ...selectedPayment,
            merchant_uid: merchantUid,
            name:
              orderItems.length > 1
                ? `${productName} 외 ${orderItems.length - 1}건`
                : productName,
            amount: totalAmount,
            buyer_name: customerName.trim(),
            buyer_tel: customerPhone.trim(),
          },
          (rsp) => resolve(rsp)
        )
      })

      if (!paymentResult?.success) {
        setStatus({
          type: 'error',
          message: paymentResult?.error_msg || '결제가 실패했습니다.',
        })
        return
      }

      const response = await apiFetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: user._id,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          payment: {
            method: paymentMethod.trim(),
            merchantUid: paymentResult?.merchant_uid || merchantUid,
            transactionId:
              paymentResult?.imp_uid ||
              paymentResult?.merchant_uid ||
              merchantUid,
          },
          items: orderItems,
          note: note.trim(),
        }),
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        setStatus({
          type: 'error',
          message: payload.message || '주문 생성에 실패했습니다.',
        })
        return
      }

      const createdOrderId = payload?._id || ''
      setOrderId(createdOrderId)
      setStatus({ type: 'success', message: '주문이 완료되었습니다.' })
      if (onComplete) {
        onComplete(createdOrderId)
      }
    } catch (error) {
      setStatus({ type: 'error', message: '네트워크 오류가 발생했습니다.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="page order-page">
      <HomeNav
        userName={user?.name || ''}
        userType={user?.user_type || ''}
        onLogin={onLogin}
        onSignup={onSignup}
        onLogout={handleLogout}
        onAdmin={onAdmin}
        onNavigateSection={onNavigateSection}
        onCart={onCart}
        onOrders={onOrders}
      />
      <main className="container order-container">
        <button className="secondary back-button" onClick={onBack}>
          돌아가기
        </button>
        <h2>주문 확인</h2>
        {status.message && (
          <p className={`status ${status.type}`}>{status.message}</p>
        )}
        {!cart && !status.message && <p>주문 정보를 불러오는 중입니다.</p>}
        {cart && cart.items?.length === 0 && (
          <p>장바구니가 비어 있습니다.</p>
        )}
        {cart && cart.items?.length > 0 && (
          <>
            <section className="order-section">
              <h3>주문자 정보</h3>
              <div className="order-form">
                <label>
                  이름
                  <input
                    type="text"
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    placeholder="주문자 이름"
                  />
                </label>
                <label>
                  전화번호
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(event) => setCustomerPhone(event.target.value)}
                    placeholder="예: 010-1234-5678"
                  />
                </label>
              </div>
            </section>
            <section className="order-section">
              <h3>결제 정보</h3>
              <div className="order-form">
                <label>
                  결제 방식
                  <select
                    value={paymentMethod}
                    onChange={(event) => setPaymentMethod(event.target.value)}
                  >
                    <option value="">선택하세요</option>
                    <option value="카드결제">카드결제</option>
                    <option value="계좌이체">계좌이체</option>
                    <option value="카카오페이">카카오페이</option>
                    <option value="네이버페이">네이버페이</option>
                  </select>
                </label>
                <label>
                  거래번호(선택)
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(event) => setTransactionId(event.target.value)}
                    placeholder="예: T20240101-0001"
                  />
                </label>
              </div>
            </section>
            <section className="order-section">
              <h3>주문 상품</h3>
              <div className="order-list">
                {cart.items.map((item, index) => (
                  <article
                    className="order-item"
                    key={`${item.product?._id || item._id || 'item'}-${index}`}
                  >
                    <div className="order-item-image">
                      {item.product?.image ? (
                        <img src={item.product.image} alt={item.product.name} />
                      ) : (
                        <div className="order-item-placeholder">이미지 없음</div>
                      )}
                    </div>
                    <div className="order-item-info">
                      <h4>{item.product?.name || '상품명 없음'}</h4>
                      {item.instructorName && (
                        <p>선택 강사: {item.instructorName}</p>
                      )}
                      <p>수량: {item.quantity || 1}</p>
                      {item.product?.price !== undefined && (
                        <p>가격: {item.product.price.toLocaleString()}원</p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
            <section className="order-section">
              <h3>요청사항</h3>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="요청사항이 있다면 적어주세요."
              />
            </section>
            <section className="order-summary">
              <div>
                <span>총 결제 금액</span>
                <strong>{totalAmount.toLocaleString()}원</strong>
              </div>
              <button
                className="primary"
                type="button"
                onClick={handleSubmitOrder}
                disabled={
                  isSubmitting ||
                  Boolean(orderId) ||
                  !customerName.trim() ||
                  !customerPhone.trim() ||
                  !paymentMethod.trim()
                }
              >
                {orderId ? '주문 완료' : isSubmitting ? '주문 처리 중...' : '주문하기'}
              </button>
            </section>
            {orderId && (
              <p className="order-id">주문번호: {orderId}</p>
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default OrderPage
