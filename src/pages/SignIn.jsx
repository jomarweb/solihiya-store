import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase, configured } from '../lib/supabase'
import { useStore } from '../lib/store.jsx'

export default function SignIn() {
  const { user } = useStore()
  const nav = useNavigate()
  const [sp] = useSearchParams()
  const next = sp.get('next') || '/account'
  const [mode, setMode] = useState('in')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const on = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  useEffect(() => { if (user) nav(next, { replace: true }) }, [user, nav, next])

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setInfo('')
    if (!configured) return setError('The store is not connected to its database yet.')
    setBusy(true)
    if (mode === 'up') {
      const { data, error } = await supabase.auth.signUp({
        email: form.email, password: form.password, options: { data: { full_name: form.name } },
      })
      if (error) setError(error.message)
      else if (!data.session) setInfo('Account created. Open the confirmation link we emailed you, then sign in.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
      if (error) setError(error.message === 'Invalid login credentials' ? 'That email and password do not match an account.' : error.message)
    }
    setBusy(false)
  }

  return (
    <div className="wrap section narrow">
      <h1>{mode === 'in' ? 'Sign in' : 'Create an account'}</h1>
      <p className="lede">{mode === 'in' ? 'Sign in to check out and see your orders.' : 'An account keeps your orders and delivery details in one place.'}</p>
      <form className="form" onSubmit={submit}>
        {mode === 'up' && (
          <label>Full name<input required autoComplete="name" value={form.name} onChange={on('name')} /></label>
        )}
        <label>Email<input required type="email" autoComplete="email" value={form.email} onChange={on('email')} /></label>
        <label>Password<input required type="password" minLength={6} autoComplete={mode === 'in' ? 'current-password' : 'new-password'} value={form.password} onChange={on('password')} />
          {mode === 'up' && <small>At least 6 characters.</small>}
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        {info && <p className="form-info" role="status">{info}</p>}
        <button className="btn block" disabled={busy}>{busy ? 'Working' : mode === 'in' ? 'Sign in' : 'Create account'}</button>
      </form>
      <p className="switch">
        {mode === 'in' ? 'New to Solihiya?' : 'Already have an account?'}{' '}
        <button className="text-btn" onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); setError(''); setInfo('') }}>
          {mode === 'in' ? 'Create an account' : 'Sign in'}
        </button>
      </p>
    </div>
  )
}
