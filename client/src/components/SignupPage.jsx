import { useEffect, useState } from 'react'
import HomeNav from './HomeNav'
import { apiFetch } from '../utils/api'

const initialForm = {
  email: '',
  name: '',
  password: '',
  user_type: 'customer',
  address: '',
}

function SignupPage({
  onBack,
  onLogin,
  onSignup,
  onLogout,
  onAdmin,
  onCart,
  onOrders,
}) {
  const [form, setForm] = useState(initialForm)
  const [status, setStatus] = useState({ type: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
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

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setStatus({ type: '', message: '' })

    try {
      const response = await apiFetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        const message = payload.message || '회원가입에 실패했습니다.'
        setStatus({ type: 'error', message })
        return
      }

      const createdId = payload._id ? ` (ID: ${payload._id})` : ''
      setStatus({ type: 'success', message: `회원가입이 완료되었습니다.${createdId}` })
      setForm(initialForm)
      onBack()
    } catch (error) {
      setStatus({ type: 'error', message: '네트워크 오류가 발생했습니다.' })
    } finally {
      setIsSubmitting(false)
    }
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
        onCart={onCart}
        onOrders={onOrders}
      />
      <main className="container">
        <h2>회원가입</h2>
        <form className="form" onSubmit={handleSubmit}>
        <label className="field">
          이메일*
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </label>

        <label className="field">
          이름*
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
          />
        </label>

        <label className="field">
          비밀번호*
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
          />
        </label>

        <input type="hidden" name="user_type" value={form.user_type} />

        <label className="field">
          사용자 유형*
          <input type="text" value="customer" readOnly />
        </label>

        <label className="field">
          주소
          <input
            type="text"
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="선택 입력"
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
            {isSubmitting ? '가입 중...' : '회원가입'}
          </button>
        </div>
        </form>
      </main>
    </div>
  )
}

export default SignupPage
