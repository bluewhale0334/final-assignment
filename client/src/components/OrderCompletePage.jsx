import HomeNav from './HomeNav'
import './OrderCompletePage.css'

function OrderCompletePage({
  orderId,
  onHome,
  onCart,
  onOrders,
  onLogin,
  onSignup,
  onLogout,
  onAdmin,
  onNavigateSection,
}) {
  return (
    <div className="page order-complete-page">
      <HomeNav
        userName=""
        userType=""
        onLogin={onLogin}
        onSignup={onSignup}
        onLogout={onLogout}
        onAdmin={onAdmin}
        onNavigateSection={onNavigateSection}
        onCart={onCart}
        onOrders={onOrders}
      />
      <main className="container order-complete-container">
        <div className="order-complete-card">
          <h2>주문이 완료되었습니다 🎉</h2>
          <p>결제가 정상적으로 처리되었습니다.</p>
          {orderId && <p className="order-complete-id">주문번호: {orderId}</p>}
          <div className="order-complete-actions">
            <button className="primary" type="button" onClick={onHome}>
              홈으로 이동
            </button>
            <button className="secondary" type="button" onClick={onOrders}>
              주문내역 보기
            </button>
            <button className="secondary" type="button" onClick={onCart}>
              장바구니 보기
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default OrderCompletePage
