import { useEffect, useState } from 'react'
import HomeNav from './HomeNav'
import { apiFetch } from '../utils/api'

function AdminPage({
  onBack,
  onLogin,
  onSignup,
  onLogout,
  onAdmin,
  onNavigateSection,
  onProductCreate,
  onProductList,
  onOrderManage,
  onCart,
  onOrders,
}) {
  const [userName, setUserName] = useState('')
  const [userType, setUserType] = useState('')

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
        <h2>관리자님 환영합니다</h2>
        <p>관리자 전용 기능을 선택해주세요.</p>
        <div className="actions">
          <button className="primary" onClick={onProductCreate}>
            상품추가
          </button>
          <button className="secondary" onClick={onProductList}>
            상품 목록
          </button>
          <button className="secondary" onClick={onOrderManage}>
            주문 관리
          </button>
          <button className="secondary">트레이너 등록&삭제</button>
        </div>
      </main>
    </div>
  )
}

export default AdminPage
