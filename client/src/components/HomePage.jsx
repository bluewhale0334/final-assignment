import { useEffect, useState } from 'react'
import HomeNav from './HomeNav'
import { apiFetch } from '../utils/api'

const trainers = [
  {
    name: '김민지',
    role: '체형 교정 · 재활',
    summary: '개인 맞춤 자세 분석으로 바른 움직임을 제안합니다.',
  },
  {
    name: '박도윤',
    role: '근력 향상 · 바디메이크',
    summary: '단기간이 아닌 지속 가능한 근력 루틴을 설계합니다.',
  },
  {
    name: '이서현',
    role: '다이어트 · 생활 습관',
    summary: '식단과 운동을 함께 관리하는 코칭을 제공합니다.',
  },
]

const fallbackProducts = [
  {
    title: '1:1 프리미엄 PT',
    description: '체성분 분석 + 목표 기반 루틴 + 주 2회 집중 관리',
  },
  {
    title: '소그룹 PT',
    description: '2~3인 소그룹으로 동기 부여와 재미를 더합니다.',
  },
  {
    title: '온라인 PT',
    description: '생활 패턴에 맞춘 비대면 코칭과 피드백 제공',
  },
]

function HomePage({
  onSignup,
  onLogin,
  onAdmin,
  onProductSelect,
  onCart,
  onOrders,
}) {
  const [userName, setUserName] = useState('')
  const [userType, setUserType] = useState('')
  const [products, setProducts] = useState([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)

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
    const fetchProducts = async () => {
      setIsLoadingProducts(true)
      try {
        const response = await apiFetch('/api/products?limit=6&page=1')
        const payload = await response.json().catch(() => ({}))
        if (!response.ok) {
          setProducts([])
          return
        }
        setProducts(Array.isArray(payload.items) ? payload.items : [])
      } catch (error) {
        setProducts([])
      } finally {
        setIsLoadingProducts(false)
      }
    }

    fetchProducts()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    setUserName('')
    setUserType('')
  }

  return (
    <div className="home-page">
      <HomeNav
        userName={userName}
        userType={userType}
        onLogin={onLogin}
        onSignup={onSignup}
        onLogout={handleLogout}
        onAdmin={onAdmin}
        onCart={onCart}
        onOrders={onOrders}
      />

      <main className="home">
        <section className="hero" id="hero">
        <div className="hero-content">
          <h2>나만의 루틴으로 달라지는 몸</h2>
          <p>
            {userName
              ? `${userName}님 환영합니다. 오늘도 건강한 하루를 시작해요.`
              : '프리미엄 PT 상품으로 목표를 빠르게 달성하세요.'}
          </p>
          <div className="hero-buttons">
            <a className="primary" href="#pt-products">
              PT 상품 보기
            </a>
            <a className="secondary" href="#trainers">
              트레이너 만나기
            </a>
          </div>
        </div>
        <div className="hero-card">
          <h3>지금 인기 있는 프로그램</h3>
          <p>체형 교정 + 근력 향상 패키지</p>
          <ul>
            <li>1:1 PT 8회</li>
            <li>주간 식단 코칭</li>
            <li>체성분 분석 리포트</li>
          </ul>
        </div>
      </section>

        <section className="section" id="trainers">
        <div className="section-header">
          <h3>트레이너 소개</h3>
          <p>경험 많은 전문 트레이너들이 목표 달성을 도와드립니다.</p>
        </div>
        <div className="grid">
          {trainers.map((trainer) => (
            <article className="card" key={trainer.name}>
              <div className="card-badge">Certified</div>
              <h4>{trainer.name}</h4>
              <p className="card-role">{trainer.role}</p>
              <p>{trainer.summary}</p>
            </article>
          ))}
        </div>
      </section>

        <section className="section" id="pt-products">
        <div className="section-header">
          <h3>PT 상품</h3>
          <p>목표와 일정에 맞춰 선택할 수 있는 프로그램을 제공합니다.</p>
        </div>
        <div className="grid">
          {(products.length > 0 ? products : fallbackProducts).map((product) => (
            <article
              className="card"
              key={product._id || product.title}
              onClick={
                product._id
                  ? () => onProductSelect(product._id)
                  : undefined
              }
              style={product._id ? { cursor: 'pointer' } : undefined}
            >
              <h4>{product.name || product.title}</h4>
              <p>{product.description || '맞춤형 PT 프로그램을 제공합니다.'}</p>
              {product.image && (
                <div className="image-preview">
                  <img src={product.image} alt={product.name} />
                </div>
              )}
              <button className="primary">
                {isLoadingProducts ? '불러오는 중...' : '상담 신청'}
              </button>
            </article>
          ))}
        </div>
      </section>

        <section className="section" id="gym">
        <div className="section-header">
          <h3>헬스장 소개</h3>
          <p>쾌적한 공간과 최신 장비로 최상의 운동 환경을 제공합니다.</p>
        </div>
        <div className="gym-info">
          <div>
            <h4>시설</h4>
            <p>프리웨이트 존, 스튜디오 룸, 스트레칭 존</p>
          </div>
          <div>
            <h4>운영 시간</h4>
            <p>평일 06:00 - 23:00 / 주말 08:00 - 20:00</p>
          </div>
          <div>
            <h4>위치</h4>
            <p>서울 강남구 테헤란로 123, 5층</p>
          </div>
        </div>
        </section>
      </main>
    </div>
  )
}

export default HomePage
