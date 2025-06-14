'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { FeaturesProps } from '../types'

const features = [
  {
    name: 'Dijital İmza',
    description: 'Yasal geçerliliği olan dijital imza ile sözleşmelerinizi güvenle imzalayın.',
    icon: '/icons/digital-signature.svg'
  },
  {
    name: 'Sözleşme Şablonları',
    description: 'Hazır şablonlar ile sözleşmelerinizi hızlıca oluşturun ve özelleştirin.',
    icon: '/icons/templates.svg'
  },
  {
    name: 'Otomatik Hatırlatmalar',
    description: 'Sözleşme yenileme ve son kullanma tarihlerini otomatik takip edin.',
    icon: '/icons/reminders.svg'
  },
  {
    name: 'Versiyon Kontrolü',
    description: 'Sözleşme değişikliklerini versiyonlayarak güvenle takip edin.',
    icon: '/icons/version-control.svg'
  },
  {
    name: 'Ekip İşbirliği',
    description: 'Ekip üyeleriyle sözleşme üzerinde gerçek zamanlı işbirliği yapın.',
    icon: '/icons/collaboration.svg'
  },
  {
    name: 'Raporlama',
    description: 'Detaylı raporlar ile sözleşme süreçlerinizi analiz edin.',
    icon: '/icons/reporting.svg'
  }
]

export default function Features({}: FeaturesProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [iconErrors, setIconErrors] = useState<Record<string, boolean>>({})

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

    const element = document.getElementById('features-section')
    if (element) {
      observer.observe(element)
    }

    return () => {
      if (element) {
        observer.unobserve(element)
      }
    }
  }, [])

  const handleIconError = (iconName: string) => {
    setIconErrors(prev => ({ ...prev, [iconName]: true }))
  }

  return (
    <div id="features-section" className="py-12 bg-gray-50 dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
            Özellikler
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            Sözleşme yönetimini kolaylaştıran güçlü özellikler
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={feature.name}
              className={`bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 transition-all duration-500 transform hover:scale-105 ${
                isVisible
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-10'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="relative h-12 w-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center">
                <Image
                  src={iconErrors[feature.name] ? '/icons/placeholder.svg' : feature.icon}
                  alt={feature.name}
                  width={24}
                  height={24}
                  className="text-indigo-600 dark:text-indigo-400"
                  onError={() => handleIconError(feature.name)}
                />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                {feature.name}
              </h3>
              <p className="mt-2 text-base text-gray-500 dark:text-gray-300">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 