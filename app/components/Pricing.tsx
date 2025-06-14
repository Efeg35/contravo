'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PricingProps } from '../types'

const plans = [
  {
    name: 'Başlangıç',
    price: 'Ücretsiz',
    description: 'Küçük ekipler için temel özellikler',
    features: [
      '5 aktif sözleşme',
      'Temel şablonlar',
      'E-posta desteği',
      'Temel raporlama'
    ],
    cta: 'Ücretsiz Başla',
    link: '/register'
  },
  {
    name: 'Profesyonel',
    price: '₺299',
    period: '/ay',
    description: 'Büyüyen işletmeler için gelişmiş özellikler',
    features: [
      'Sınırsız sözleşme',
      'Özel şablonlar',
      'Öncelikli destek',
      'Gelişmiş raporlama',
      'Ekip işbirliği',
      'API erişimi'
    ],
    cta: 'Hemen Başla',
    link: '/register?plan=pro',
    highlighted: true
  },
  {
    name: 'Kurumsal',
    price: 'Özel',
    description: 'Büyük organizasyonlar için özel çözümler',
    features: [
      'Özel entegrasyonlar',
      'Dedike destek',
      'Özel eğitim',
      'SLA garantisi',
      'Gelişmiş güvenlik',
      'Çoklu lokasyon desteği'
    ],
    cta: 'İletişime Geç',
    link: '/contact'
  }
]

export default function Pricing({}: PricingProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    const element = document.getElementById('pricing-section')
    if (element) {
      observer.observe(element)
    }

    return () => {
      if (element) {
        observer.unobserve(element)
      }
    }
  }, [])

  return (
    <div id="pricing-section" className="py-12 bg-gray-50 dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
            Fiyatlandırma
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            İhtiyaçlarınıza uygun planı seçin
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 transition-all duration-500 transform hover:scale-105 ${
                plan.highlighted
                  ? 'ring-2 ring-indigo-600 dark:ring-indigo-400'
                  : ''
              } ${
                isVisible
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-10'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {plan.name}
              </h3>
              <div className="mt-4 flex items-baseline">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">
                  {plan.price}
                </span>
                {plan.period && (
                  <span className="ml-1 text-xl text-gray-500 dark:text-gray-400">
                    {plan.period}
                  </span>
                )}
              </div>
              <p className="mt-4 text-gray-600 dark:text-gray-300">
                {plan.description}
              </p>
              <ul className="mt-8 space-y-4">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center text-gray-600 dark:text-gray-300"
                  >
                    <svg
                      className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Link
                  href={plan.link}
                  className={`block w-full py-3 px-4 rounded-md text-center font-medium transition-colors ${
                    plan.highlighted
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 