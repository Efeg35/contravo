'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'

type Testimonial = {
  content: string
  author: string
  role: string
  company: string
  image: string
}

const testimonials: Testimonial[] = [
  {
    content: 'Contravo sayesinde sözleşme süreçlerimizi %60 daha hızlı tamamlıyoruz. Kullanıcı dostu arayüzü ve güçlü özellikleri ile işimizi çok kolaylaştırdı.',
    author: 'Ahmet Yılmaz',
    role: 'Hukuk Müdürü',
    company: 'Tech A.Ş.',
    image: '/testimonials/ahmet.jpg'
  },
  {
    content: 'Dijital dönüşüm sürecimizde Contravo\'nun sağladığı çözümler çok değerli oldu. Özellikle sözleşme takibi ve raporlama özellikleri ile süreçlerimizi çok daha verimli hale getirdik.',
    author: 'Ayşe Kaya',
    role: 'Genel Müdür',
    company: 'Finans Ltd.',
    image: '/testimonials/ayse.jpg'
  },
  {
    content: 'Contravo\'nun sağladığı otomasyon ve entegrasyon özellikleri sayesinde hukuk departmanımızın iş yükü önemli ölçüde azaldı. Kesinlikle tavsiye ediyorum.',
    author: 'Mehmet Demir',
    role: 'Hukuk Danışmanı',
    company: 'Global İnşaat',
    image: '/testimonials/mehmet.jpg'
  }
]

export default function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0)

  const nextTestimonial = useCallback(() => {
    setActiveIndex(prev => (prev + 1) % testimonials.length)
  }, [])

  const prevTestimonial = useCallback(() => {
    setActiveIndex(prev => (prev - 1 + testimonials.length) % testimonials.length)
  }, [])

  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Müşterilerimiz Ne Diyor?
        </h2>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
          Contravo ile çalışan müşterilerimizin deneyimleri
        </p>
      </div>

      <div className="relative" role="list" aria-label="Müşteri Yorumları">
        {testimonials.map((testimonial, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === activeIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
            role="listitem"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-3xl mx-auto">
              <div className="flex items-center mb-6">
                <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                  <Image
                    src={testimonial.image}
                    alt={testimonial.author}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = `/testimonials/placeholder.jpg`
                    }}
                  />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {testimonial.author}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {testimonial.role}, {testimonial.company}
                  </p>
                </div>
              </div>
              <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
                &quot;{testimonial.content}&quot;
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-8 space-x-4">
        <button
          onClick={prevTestimonial}
          className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200"
          aria-label="Önceki yorum"
        >
          <svg
            className="w-6 h-6 text-gray-600 dark:text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <button
          onClick={nextTestimonial}
          className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200"
          aria-label="Sonraki yorum"
        >
          <svg
            className="w-6 h-6 text-gray-600 dark:text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </div>
  )
} 