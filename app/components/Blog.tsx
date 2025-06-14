'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { BlogProps } from '../types'

const articles = [
  {
    title: 'Sözleşme Yönetiminde Dijital Dönüşüm',
    description:
      'Modern işletmelerde sözleşme yönetiminin dijitalleşmesi ve sağladığı avantajlar.',
    image: '/blog/digital-transformation.jpg',
    date: '15 Mart 2024',
    author: 'Ahmet Yılmaz',
    category: 'Dijital Dönüşüm',
    slug: 'sozlesme-yonetiminde-dijital-donusum'
  },
  {
    title: 'Sözleşme Süreçlerini Otomatikleştirme',
    description:
      'Sözleşme süreçlerinizi otomatikleştirerek verimliliğinizi nasıl artırabilirsiniz?',
    image: '/blog/automation.jpg',
    date: '10 Mart 2024',
    author: 'Ayşe Demir',
    category: 'Otomasyon',
    slug: 'sozlesme-sureclerini-otomatiklestirme'
  },
  {
    title: 'Sözleşme Güvenliği ve Uyumluluk',
    description:
      'Sözleşmelerinizde güvenlik ve yasal uyumluluk nasıl sağlanır?',
    image: '/blog/security.jpg',
    date: '5 Mart 2024',
    author: 'Mehmet Kaya',
    category: 'Güvenlik',
    slug: 'sozlesme-guvenligi-ve-uyumluluk'
  }
]

export default function Blog({}: BlogProps) {
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

    const element = document.getElementById('blog-section')
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
    <div id="blog-section" className="py-12 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
            Blog
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            Sözleşme yönetimi hakkında güncel bilgiler ve ipuçları
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article, index) => (
            <article
              key={article.slug}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-all duration-500 transform hover:scale-105 ${
                isVisible
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-10'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="relative h-48 w-full">
                <Image
                  src={imageErrors[article.slug] ? '/blog/placeholder.jpg' : article.image}
                  alt={article.title}
                  fill
                  className="object-cover"
                  onError={() => handleImageError(article.slug)}
                />
              </div>
              <div className="p-6">
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <span>{article.date}</span>
                  <span className="mx-2">•</span>
                  <span>{article.category}</span>
                </div>
                <h3 className="mt-2 text-xl font-bold text-gray-900 dark:text-white">
                  {article.title}
                </h3>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                  {article.description}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {article.author}
                  </span>
                  <Link
                    href={`/blog/${article.slug}`}
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-medium"
                  >
                    Devamını Oku →
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
} 