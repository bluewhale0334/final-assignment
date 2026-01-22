import { useEffect, useState } from 'react'
import HomeNav from './HomeNav'
import './OrderAdminPage.css'
import { apiFetch } from '../utils/api'

function OrderAdminPage({
  onBack,
  onLogin,
  onSignup,
  onLogout,
  onAdmin,
  onNavigateSection,
  onCart,
  onOrders,
}) {
  const [user, setUser] = useState(null)
  const [orders, setOrders] = useState([])
  const [status, setStatus] = useState({ type: '', message: '' })
  const [updatingId, setUpdatingId] = useState('')

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

        const orderResponse = await apiFetch('/api/orders')
        const orderPayload = await orderResponse.json().catch(() => ({}))
        if (!orderResponse.ok) {
          setStatus({
            type: 'error',
            message: orderPayload.message || '주문 내역을 불러오지 못했습니다.',
          })
          return
        }
        setOrders(Array.isArray(orderPayload) ? orderPayload : [])
      } catch (error) {
        setStatus({ type: 'error', message: '네트워크 오류가 발생했습니다.' })
      }
    }

    fetchData()
  }, [])

  const handleLogout = () => {
    setUser(null)
    if (onLogout) {
      onLogout()
    }
  }

  const handleStatusChange = async (orderId, nextStatus) => {
    if (!orderId || !nextStatus) return
    setUpdatingId(orderId)
    setStatus({ type: '', message: '' })
    try {
      const response = await apiFetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        setStatus({
          type: 'error',
          message: payload.message || '주문 상태 변경에 실패했습니다.',
        })
        return
      }
      setOrders((prev) =>
        prev.map((order) => (order._id === orderId ? payload : order))
      )
    } catch (error) {
      setStatus({ type: 'error', message: '네트워크 오류가 발생했습니다.' })
    } finally {
      setUpdatingId('')
    }
  }

  return (
    <div className="page order-admin-page">
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
      <main className="container order-admin-container">
        <button className="secondary back-button" onClick={onBack}>
          돌아가기
        </button>
        <h2>주문 관리</h2>
        {status.message && (
          <p className={`status ${status.type}`}>{status.message}</p>
        )}
        {!status.message && orders.length === 0 && <p>주문 내역이 없습니다.</p>}
        {orders.length > 0 && (
          <div className="order-admin-list">
            {orders.map((order) => (
              <article className="order-admin-card" key={order._id}>
                <header>
                  <div>
                    <strong>주문번호</strong>
                    <span>{order._id}</span>
                  </div>
                  <div className="order-admin-status">
                    <strong>상태</strong>
                    <div className="order-admin-status-control">
                      <select
                        value={order.status || 'pending'}
                        onChange={(event) =>
                          handleStatusChange(order._id, event.target.value)
                        }
                        disabled={updatingId === order._id}
                      >
                        <option value="pending">pending</option>
                        <option value="paid">paid</option>
                        <option value="cancelled">cancelled</option>
                      </select>
                    </div>
                  </div>
                </header>
                <div className="order-admin-meta">
                  <span>주문자: {order.customerName || '-'}</span>
                  <span>연락처: {order.customerPhone || '-'}</span>
                  <span>결제방식: {order.payment?.method || '-'}</span>
                  <span>
                    총액: {Number(order.totalAmount || 0).toLocaleString()}원
                  </span>
                </div>
                <div className="order-admin-items">
                  {order.items?.map((item, index) => (
                    <div
                      className="order-admin-item"
                      key={`${item.product?._id || item.product || 'item'}-${index}`}
                    >
                      <span className="item-name">
                        {item.productSnapshot?.name || '상품명 없음'}
                      </span>
                      <span className="item-qty">x{item.quantity || 1}</span>
                      <span className="item-price">
                        {Number(item.productSnapshot?.price || 0).toLocaleString()}
                        원
                      </span>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default OrderAdminPage
