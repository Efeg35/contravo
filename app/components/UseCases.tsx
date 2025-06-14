'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { UseCasesProps } from '../types'

const useCases = [
  {
    title: 'İK Sözleşmeleri',
    description: 'İşe alım, iş sözleşmesi ve gizlilik anlaşmalarını yönetin.',
    image: '/images/hr-contracts.jpg',
    features: [
      'İş sözleşmesi şablonları',
      'Otomatik yenileme takibi',
      'Çalışan onayları',
      'Gizlilik anlaşmaları'
    ]
  },
  {
    title: 'Satış Sözleşmeleri',
    description: 'Müşteri ve tedarikçi sözleşmelerini dijitalleştirin.',
    image: '/images/sales-contracts.jpg',
    features: [
      'Satış sözleşmesi şablonları',
      'Müşteri onayları',
      'Ödeme takibi',
      'Teslimat takibi'
    ]
  },
  {
    title: 'Kira Sözleşmeleri',
    description: 'Kira sözleşmelerini ve yenileme süreçlerini yönetin.',
    image: '/images/lease-contracts.jpg',
    features: [
      'Kira sözleşmesi şablonları',
      'Otomatik yenileme hatırlatmaları',
      'Kiracı onayları',
      'Ödeme takibi'
    ]
  }
]

export default function UseCases({}: UseCasesProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})

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

    const element = document.getElementById('use-cases-section')
    if (element) {
      observer.observe(element)
    }

    return () => {
      if (element) {
        observer.unobserve(element)
      }
    }
  }, [])

  const handleImageError = (imageName: string) => {
    setImageErrors(prev => ({ ...prev, [imageName]: true }))
  }

  return (
    <div id="use-cases-section" className="py-12 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
            Kullanım Alanları
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            Sözleşme yönetimini farklı alanlarda nasıl kullanabileceğinizi keşfedin
          </p>
        </div>

        <div className="mt-12 space-y-12">
          {useCases.map((useCase, index) => (
            <div
              key={useCase.title}
              className={`flex flex-col md:flex-row gap-8 items-center ${
                index % 2 === 1 ? 'md:flex-row-reverse' : ''
              }`}
            >
              <div
                className={`flex-1 transition-all duration-500 transform ${
                  isVisible
                    ? 'opacity-100 translate-x-0'
                    : index % 2 === 0
                    ? 'opacity-0 -translate-x-10'
                    : 'opacity-0 translate-x-10'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="relative h-64 w-full rounded-lg overflow-hidden">
                  <Image
                    src={imageErrors[useCase.title] ? '/images/placeholder.jpg' : useCase.image}
                    alt={useCase.title}
                    fill
                    className="object-cover"
                    onError={() => handleImageError(useCase.title)}
                  />
                </div>
              </div>
              <div
                className={`flex-1 transition-all duration-500 transform ${
                  isVisible
                    ? 'opacity-100 translate-x-0'
                    : index % 2 === 0
                    ? 'opacity-0 translate-x-10'
                    : 'opacity-0 -translate-x-10'
                }`}
                style={{ transitionDelay: `${index * 100 + 100}ms` }}
              >
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {useCase.title}
                </h3>
                <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
                  {useCase.description}
                </p>
                <ul className="mt-6 space-y-3">
                  {useCase.features.map((feature) => (
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
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 