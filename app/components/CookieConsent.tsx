'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { CookieConsentProps } from '../types'

export default function CookieConsent({}: CookieConsentProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent')
    if (!consent) {
      setIsVisible(true)
    }
  }, [])

  const acceptCookies = useCallback(() => {
    localStorage.setItem('cookieConsent', 'true')
    setIsVisible(false)
  }, [])

  if (!isVisible) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 shadow-lg border-t border-gray-200 dark:border-gray-700 p-4 z-50"
      role="alert"
      aria-live="polite"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-gray-600 dark:text-gray-300">
          <p>
            Bu web sitesi, size en iyi deneyimi sunmak için çerezleri kullanmaktadır.
            Daha fazla bilgi için{' '}
            <Link
              href="/privacy-policy"
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 underline focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 rounded"
            >
              gizlilik politikamızı
            </Link>{' '}
            inceleyebilirsiniz.
          </p>
        </div>
        <button
          onClick={acceptCookies}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900 transition-colors duration-200"
          aria-label="Çerezleri kabul et"
        >
          Kabul Et
        </button>
      </div>
    </div>
  )
} 