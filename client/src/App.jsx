import { useState } from 'react'
import './App.css'
import HomePage from './components/HomePage'
import SignupPage from './components/SignupPage'
import LoginPage from './components/LoginPage'
import AdminPage from './components/AdminPage'
import ProductCreatePage from './components/ProductCreatePage'
import ProductListPage from './components/ProductListPage'
import ProductDetailPage from './components/ProductDetailPage'
import CartPage from './components/CartPage'
import OrderPage from './components/OrderPage'
import OrderCompletePage from './components/OrderCompletePage'
import OrderHistoryPage from './components/OrderHistoryPage'
import OrderAdminPage from './components/OrderAdminPage'

function App() {
  const [page, setPage] = useState('home')
  const [selectedProductId, setSelectedProductId] = useState('')
  const [lastOrderId, setLastOrderId] = useState('')

  return (
    <div className="app">
      <header className="header">
        <h1>Muscle Shopping</h1>
      </header>

      {page === 'home' && (
        <HomePage
          onSignup={() => setPage('signup')}
          onLogin={() => setPage('login')}
          onAdmin={() => setPage('admin')}
          onProductSelect={(productId) => {
            setSelectedProductId(productId)
            setPage('product-detail')
          }}
          onCart={() => setPage('cart')}
          onOrders={() => setPage('orders')}
        />
      )}
      {page === 'signup' && (
        <SignupPage
          onBack={() => setPage('home')}
          onLogin={() => setPage('login')}
          onSignup={() => setPage('signup')}
          onLogout={() => setPage('home')}
          onAdmin={() => setPage('admin')}
          onCart={() => setPage('cart')}
          onOrders={() => setPage('orders')}
        />
      )}
      {page === 'login' && (
        <LoginPage
          onBack={() => setPage('home')}
          onSuccess={() => setPage('home')}
          onLogin={() => setPage('login')}
          onSignup={() => setPage('signup')}
          onLogout={() => setPage('home')}
          onAdmin={() => setPage('admin')}
          onCart={() => setPage('cart')}
          onOrders={() => setPage('orders')}
        />
      )}
      {page === 'admin' && (
        <AdminPage
          onBack={() => setPage('home')}
          onLogin={() => setPage('login')}
          onSignup={() => setPage('signup')}
          onLogout={() => setPage('home')}
          onAdmin={() => setPage('admin')}
          onProductCreate={() => setPage('product-create')}
          onProductList={() => setPage('product-list')}
          onOrderManage={() => setPage('order-admin')}
          onCart={() => setPage('cart')}
          onOrders={() => setPage('orders')}
          onNavigateSection={(hash) => {
            setPage('home')
            setTimeout(() => {
              window.location.hash = hash
            }, 0)
          }}
        />
      )}
      {page === 'product-create' && (
        <ProductCreatePage
          onBack={() => setPage('admin')}
          onLogin={() => setPage('login')}
          onSignup={() => setPage('signup')}
          onLogout={() => setPage('home')}
          onAdmin={() => setPage('admin')}
          onCart={() => setPage('cart')}
          onOrders={() => setPage('orders')}
          onNavigateSection={(hash) => {
            setPage('home')
            setTimeout(() => {
              window.location.hash = hash
            }, 0)
          }}
        />
      )}
      {page === 'product-list' && (
        <ProductListPage
          onBack={() => setPage('admin')}
          onLogin={() => setPage('login')}
          onSignup={() => setPage('signup')}
          onLogout={() => setPage('home')}
          onAdmin={() => setPage('admin')}
          onCart={() => setPage('cart')}
          onOrders={() => setPage('orders')}
          onNavigateSection={(hash) => {
            setPage('home')
            setTimeout(() => {
              window.location.hash = hash
            }, 0)
          }}
        />
      )}
      {page === 'product-detail' && (
        <ProductDetailPage
          productId={selectedProductId}
          onBack={() => setPage('home')}
          onLogin={() => setPage('login')}
          onSignup={() => setPage('signup')}
          onLogout={() => setPage('home')}
          onAdmin={() => setPage('admin')}
          onCart={() => setPage('cart')}
          onOrders={() => setPage('orders')}
          onNavigateSection={(hash) => {
            setPage('home')
            setTimeout(() => {
              window.location.hash = hash
            }, 0)
          }}
        />
      )}
      {page === 'cart' && (
        <CartPage
          onBack={() => setPage('home')}
          onLogin={() => setPage('login')}
          onSignup={() => setPage('signup')}
          onLogout={() => setPage('home')}
          onAdmin={() => setPage('admin')}
          onCart={() => setPage('cart')}
          onOrders={() => setPage('orders')}
          onCheckout={() => setPage('order')}
          onNavigateSection={(hash) => {
            setPage('home')
            setTimeout(() => {
              window.location.hash = hash
            }, 0)
          }}
        />
      )}
      {page === 'order' && (
        <OrderPage
          onBack={() => setPage('cart')}
          onLogin={() => setPage('login')}
          onSignup={() => setPage('signup')}
          onLogout={() => setPage('home')}
          onAdmin={() => setPage('admin')}
          onCart={() => setPage('cart')}
          onOrders={() => setPage('orders')}
          onComplete={(orderId) => {
            setLastOrderId(orderId || '')
            setPage('order-complete')
          }}
          onNavigateSection={(hash) => {
            setPage('home')
            setTimeout(() => {
              window.location.hash = hash
            }, 0)
          }}
        />
      )}
      {page === 'order-complete' && (
        <OrderCompletePage
          orderId={lastOrderId}
          onHome={() => setPage('home')}
          onCart={() => setPage('cart')}
          onOrders={() => setPage('orders')}
          onLogin={() => setPage('login')}
          onSignup={() => setPage('signup')}
          onLogout={() => setPage('home')}
          onAdmin={() => setPage('admin')}
          onNavigateSection={(hash) => {
            setPage('home')
            setTimeout(() => {
              window.location.hash = hash
            }, 0)
          }}
        />
      )}
      {page === 'orders' && (
        <OrderHistoryPage
          onBack={() => setPage('home')}
          onLogin={() => setPage('login')}
          onSignup={() => setPage('signup')}
          onLogout={() => setPage('home')}
          onAdmin={() => setPage('admin')}
          onCart={() => setPage('cart')}
          onOrders={() => setPage('orders')}
          onNavigateSection={(hash) => {
            setPage('home')
            setTimeout(() => {
              window.location.hash = hash
            }, 0)
          }}
        />
      )}
      {page === 'order-admin' && (
        <OrderAdminPage
          onBack={() => setPage('admin')}
          onLogin={() => setPage('login')}
          onSignup={() => setPage('signup')}
          onLogout={() => setPage('home')}
          onAdmin={() => setPage('admin')}
          onCart={() => setPage('cart')}
          onOrders={() => setPage('orders')}
          onNavigateSection={(hash) => {
            setPage('home')
            setTimeout(() => {
              window.location.hash = hash
            }, 0)
          }}
        />
      )}
    </div>
  )
}

export default App
