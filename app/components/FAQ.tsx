'use client'

import { useState, useCallback } from 'react'
import { FAQProps } from '../types'

const faqItems = [
  {
    question: 'Sözleşme yönetim sistemi nedir?',
    answer:
      'Sözleşme yönetim sistemi, işletmelerin sözleşmelerini dijital ortamda oluşturmasına, saklamasına, takip etmesine ve yönetmesine olanak sağlayan bir yazılımdır. Bu sistem, sözleşme süreçlerini otomatikleştirerek verimliliği artırır ve riskleri azaltır.'
  },
  {
    question: 'Dijital imzalar yasal olarak geçerli mi?',
    answer:
      'Evet, dijital imzalar 5070 sayılı Elektronik İmza Kanunu kapsamında yasal olarak geçerlidir. Sistemimiz, güvenli ve yasal olarak bağlayıcı dijital imzalar oluşturmanızı sağlar.'
  },
  {
    question: 'Sistem nasıl güvenliği sağlıyor?',
    answer:
      'Sistemimiz, en son güvenlik standartlarını kullanarak verilerinizi korur. SSL şifreleme, çift faktörlü kimlik doğrulama ve düzenli güvenlik denetimleri ile verileriniz güvende tutulur.'
  },
  {
    question: 'Farklı sözleşme türlerini yönetebilir miyim?',
    answer:
      'Evet, sistemimiz iş sözleşmeleri, satış sözleşmeleri, kira sözleşmeleri, hizmet sözleşmeleri ve daha birçok sözleşme türünü yönetmenize olanak sağlar.'
  },
  {
    question: 'Teknik destek alabilir miyim?',
    answer:
      'Evet, 7/24 teknik destek ekibimiz size yardımcı olmak için hazırdır. E-posta, telefon ve canlı destek kanalları üzerinden bize ulaşabilirsiniz.'
  }
]

export default function FAQ({}: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleFAQ = useCallback((index: number) => {
    setOpenIndex(prevIndex => (prevIndex === index ? null : index))
  }, [])

  return (
    <div className="bg-gray-50 dark:bg-gray-800 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
            Sıkça Sorulan Sorular
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            Merak ettiğiniz soruların cevaplarını bulun
          </p>
        </div>

        <div className="mt-12 max-w-3xl mx-auto">
          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-900 rounded-lg shadow-sm overflow-hidden"
              >
                <button
                  className="w-full px-6 py-4 text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                  onClick={() => toggleFAQ(index)}
                  aria-expanded={openIndex === index}
                  aria-controls={`faq-answer-${index}`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {item.question}
                    </h3>
                    <svg
                      className={`h-5 w-5 text-gray-500 dark:text-gray-400 transform transition-transform duration-200 ${
                        openIndex === index ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </button>
                <div
                  id={`faq-answer-${index}`}
                  className={`px-6 transition-all duration-200 ease-in-out ${
                    openIndex === index
                      ? 'max-h-96 opacity-100'
                      : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="pb-4 text-gray-600 dark:text-gray-300">
                    {item.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 