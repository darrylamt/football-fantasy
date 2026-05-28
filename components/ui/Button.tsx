'use client'

import { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  const base = 'font-barlow font-bold uppercase tracking-wide transition-all duration-150 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary: 'bg-[#4ade80] text-[#0a1400] hover:bg-[#22c55e]',
    secondary: 'bg-[#1f3d1f] text-[#f0fdf4] hover:bg-[#2d5a2d] border border-[#2d5a2d]',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'bg-transparent text-[#4ade80] hover:bg-[#1f3d1f] border border-[#1f3d1f]',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-7 py-3 text-lg',
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <span className="animate-pulse">Loading...</span> : children}
    </button>
  )
}
