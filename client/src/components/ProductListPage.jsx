import { useEffect, useState } from 'react'
import HomeNav from './HomeNav'
import './ProductListPage.css'
import { apiFetch } from '../utils/api'

function ProductListPage({
  onBack,
  onLogin,
  onSignup,
  onLogout,
  onAdmin,
  onNavigateSection,
  onCart,
  onOrders,
}) {
  const [products, setProducts] = useState([])
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [status, setStatus] = useState({ type: '', message: '' })
  const [userName, setUserName] = useState('')
  const [userType, setUserType] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const pageSize = 5
  const [editingId, setEditingId] = useState('')
  const [editForm, setEditForm] = useState({
    sku: '',
    name: '',
    price: '',
    category: 'HappyHour',
    image: '',
    description: '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState('')

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
      setStatus({ type: '', message: '' })
      try {
        const response = await apiFetch(
          `/api/products?page=${page}&limit=${pageSize}`
        )
        const payload = await response.json().catch(() => ({}))
        if (!response.ok) {
          const message = payload.message || '상품 목록을 불러오지 못했습니다.'
          setStatus({ type: 'error', message })
          return
        }
        setProducts(Array.isArray(payload.items) ? payload.items : [])
        setTotalPages(payload.totalPages || 1)
      } catch (error) {
        setStatus({ type: 'error', message: '네트워크 오류가 발생했습니다.' })
      }
    }

    fetchProducts()
  }, [page])

  const filteredProducts =
    categoryFilter === 'all'
      ? products
      : products.filter((product) => product.category === categoryFilter)

  useEffect(() => {
    setPage(1)
  }, [categoryFilter])

  const startEdit = (product) => {
    setEditingId(product._id)
    setEditForm({
      sku: product.sku || '',
      name: product.name || '',
      price: String(product.price ?? ''),
      category: product.category || 'HappyHour',
      image: product.image || '',
      description: product.description || '',
    })
  }

  const cancelEdit = () => {
    setEditingId('')
    setEditForm({
      sku: '',
      name: '',
      price: '',
      category: 'HappyHour',
      image: '',
      description: '',
    })
  }

  const handleEditChange = (event) => {
    const { name, value } = event.target
    setEditForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleUpdate = async (productId) => {
    setIsSaving(true)
    setStatus({ type: '', message: '' })
    try {
      const payload = {
        ...editForm,
        price: Number(editForm.price),
      }
      const response = await apiFetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        const message = result.message || '상품 수정에 실패했습니다.'
        setStatus({ type: 'error', message })
        return
      }
      setProducts((prev) =>
        prev.map((item) => (item._id === productId ? result : item))
      )
      setStatus({ type: 'success', message: '상품이 수정되었습니다.' })
      cancelEdit()
    } catch (error) {
      setStatus({ type: 'error', message: '네트워크 오류가 발생했습니다.' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (productId) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) {
      return
    }
    setIsDeleting(productId)
    setStatus({ type: '', message: '' })
    try {
      const response = await apiFetch(`/api/products/${productId}`, {
        method: 'DELETE',
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        const message = result.message || '상품 삭제에 실패했습니다.'
        setStatus({ type: 'error', message })
        return
      }
      setProducts((prev) => prev.filter((item) => item._id !== productId))
      setStatus({ type: 'success', message: '상품이 삭제되었습니다.' })
    } catch (error) {
      setStatus({ type: 'error', message: '네트워크 오류가 발생했습니다.' })
    } finally {
      setIsDeleting('')
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
    <div className="page product-list-page">
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
      <main className="container product-list-container">
        <h2>상품 목록</h2>
        <label className="field category-filter">
          카테고리 필터
          <select
            name="categoryFilter"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
          >
            <option value="all">전체</option>
            <option value="HappyHour">HappyHour</option>
            <option value="일반 PT">일반 PT</option>
          </select>
        </label>
        {status.message && (
          <p className={`status ${status.type}`}>{status.message}</p>
        )}
        {!status.message && filteredProducts.length === 0 && (
          <p>등록된 상품이 없습니다.</p>
        )}
        {filteredProducts.length > 0 && (
          <div className="grid product-grid">
            {filteredProducts.map((product) => (
              <article className="card product-card" key={product._id}>
                {editingId === product._id ? (
                  <>
                    <label className="field">
                      SKU*
                      <input
                        type="text"
                        name="sku"
                        value={editForm.sku}
                        onChange={handleEditChange}
                        required
                      />
                    </label>
                    <label className="field">
                      상품 이름*
                      <input
                        type="text"
                        name="name"
                        value={editForm.name}
                        onChange={handleEditChange}
                        required
                      />
                    </label>
                    <label className="field">
                      상품 가격*
                      <input
                        type="number"
                        name="price"
                        value={editForm.price}
                        onChange={handleEditChange}
                        min="0"
                        required
                      />
                    </label>
                    <label className="field">
                      카테고리*
                      <select
                        name="category"
                        value={editForm.category}
                        onChange={handleEditChange}
                      >
                        <option value="HappyHour">HappyHour</option>
                        <option value="일반 PT">일반 PT</option>
                      </select>
                    </label>
                    <label className="field">
                      이미지 URL*
                      <input
                        type="text"
                        name="image"
                        value={editForm.image}
                        onChange={handleEditChange}
                        required
                      />
                    </label>
                    <label className="field">
                      설명
                      <textarea
                        name="description"
                        value={editForm.description}
                        onChange={handleEditChange}
                        rows="3"
                      />
                    </label>
                    {editForm.image && (
                      <div className="image-preview">
                        <img src={editForm.image} alt={editForm.name} />
                      </div>
                    )}
                    <div className="actions">
                      <button
                        className="secondary"
                        type="button"
                        onClick={cancelEdit}
                        disabled={isSaving}
                      >
                        취소
                      </button>
                      <button
                        className="primary"
                        type="button"
                        onClick={() => handleUpdate(product._id)}
                        disabled={isSaving}
                      >
                        {isSaving ? '저장 중...' : '저장'}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h4>{product.name}</h4>
                    <p>SKU: {product.sku}</p>
                    <p>카테고리: {product.category}</p>
                    <p>가격: {product.price.toLocaleString()}원</p>
                    {product.image && (
                      <div className="image-preview">
                        <img src={product.image} alt={product.name} />
                      </div>
                    )}
                    <div className="actions">
                      <button
                        className="secondary"
                        type="button"
                        onClick={() => startEdit(product)}
                      >
                        수정
                      </button>
                      <button
                        className="secondary"
                        type="button"
                        onClick={() => handleDelete(product._id)}
                        disabled={isDeleting === product._id}
                      >
                        {isDeleting === product._id ? '삭제 중...' : '삭제'}
                      </button>
                    </div>
                  </>
                )}
              </article>
            ))}
          </div>
        )}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="secondary"
              type="button"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
            >
              이전
            </button>
            <span>
              {page} / {totalPages}
            </span>
            <button
              className="secondary"
              type="button"
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
            >
              다음
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

export default ProductListPage
