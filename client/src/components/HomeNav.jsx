import { useEffect, useRef, useState } from 'react'

function HomeNav({
  userName,
  userType,
  onLogin,
  onSignup,
  onLogout,
  onAdmin,
  onCart,
  onOrders,
  onNavigateSection,
  isAdminPage,
  onAdminBack,
}) {
  const [isSticky, setIsSticky] = useState(false)
  const navRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => {
      if (!navRef.current) return
      const navOffset = navRef.current.offsetTop
      const threshold = navOffset
      setIsSticky(window.scrollY >= threshold)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleNavClick = (hash) => (event) => {
    if (!onNavigateSection) return
    event.preventDefault()
    onNavigateSection(hash)
  }

  return (
    <nav ref={navRef} className={`home-nav${isSticky ? ' is-sticky' : ''}`}>
      <div className="home-nav-inner">
        <div className="home-brand">
          <span className="home-logo">PT Studio</span>
          <span className="home-tagline">퍼스널 트레이닝 쇼핑몰</span>
        </div>
        <div className="home-links">
          <a href="#pt-products" onClick={handleNavClick('#pt-products')}>
            PT상품
          </a>
          <a href="#trainers" onClick={handleNavClick('#trainers')}>
            트레이너 소개
          </a>
          <a href="#gym" onClick={handleNavClick('#gym')}>
            헬스장 소개
          </a>
        </div>
        <div className="home-actions">
          <button
            className="secondary"
            onClick={() => {
              if (onCart) onCart()
            }}
          >
            장바구니
          </button>
          <button
            className="secondary"
            onClick={() => {
              if (onOrders) onOrders()
            }}
          >
            내 주문내역
          </button>
          {userName ? (
            <>
              {userType === 'admin' && (
                <button
                  className="secondary"
                  onClick={isAdminPage ? onAdminBack : onAdmin}
                >
                  {isAdminPage ? '돌아가기' : '관리자 페이지'}
                </button>
              )}
              <button className="secondary" onClick={onLogout}>
                로그아웃
              </button>
            </>
          ) : (
            <>
              <button className="secondary" onClick={onLogin}>
                로그인
              </button>
              <button className="primary" onClick={onSignup}>
                회원가입
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default HomeNav
