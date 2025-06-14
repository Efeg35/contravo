'use client';

import React, { useState } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';

interface AnalyticsData {
  contracts: {
    monthly: { month: string; count: number; value: number }[];
    status: { name: string; value: number; color: string }[];
    trends: { date: string; contracts: number; revenue: number }[];
  };
  performance: {
    responseTime: { time: string; value: number }[];
    userActivity: { hour: string; users: number }[];
  };
}

interface AnalyticsChartsProps {
  data?: AnalyticsData;
  loading?: boolean;
}

export default function AnalyticsCharts({ data, loading = false }: AnalyticsChartsProps) {
  const [selectedChart, setSelectedChart] = useState('overview');

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const mockData: AnalyticsData = data || {
    contracts: {
      monthly: [
        { month: 'Oca', count: 12, value: 45000 },
        { month: 'Şub', count: 19, value: 67000 },
        { month: 'Mar', count: 15, value: 52000 },
        { month: 'Nis', count: 22, value: 78000 },
        { month: 'May', count: 18, value: 61000 },
        { month: 'Haz', count: 25, value: 89000 },
      ],
      status: [
        { name: 'İmzalandı', value: 45, color: '#10b981' },
        { name: 'İncelemede', value: 23, color: '#f59e0b' },
        { name: 'Taslak', value: 18, color: '#6b7280' },
        { name: 'Reddedildi', value: 9, color: '#ef4444' },
        { name: 'Arşivlendi', value: 5, color: '#8b5cf6' },
      ],
      trends: [
        { date: '01/06', contracts: 5, revenue: 15000 },
        { date: '08/06', contracts: 8, revenue: 24000 },
        { date: '15/06', contracts: 12, revenue: 36000 },
        { date: '22/06', contracts: 7, revenue: 21000 },
        { date: '29/06', contracts: 15, revenue: 45000 },
      ],
    },
    performance: {
      responseTime: [
        { time: '00:00', value: 120 },
        { time: '04:00', value: 95 },
        { time: '08:00', value: 180 },
        { time: '12:00', value: 220 },
        { time: '16:00', value: 200 },
        { time: '20:00', value: 150 },
      ],
      userActivity: [
        { hour: '06:00', users: 12 },
        { hour: '09:00', users: 45 },
        { hour: '12:00', users: 67 },
        { hour: '15:00', users: 52 },
        { hour: '18:00', users: 38 },
        { hour: '21:00', users: 23 },
      ],
    },
  };

  const chartOptions = [
    { id: 'overview', label: 'Genel Bakış', icon: '📊' },
    { id: 'contracts', label: 'Sözleşme Analizi', icon: '📄' },
    { id: 'performance', label: 'Performans', icon: '⚡' },
    { id: 'trends', label: 'Trendler', icon: '📈' },
  ];

  const renderOverviewCharts = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Aylık Sözleşme Sayısı */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Aylık Sözleşme Sayısı</h3>
          <div className="flex items-center space-x-2 text-sm text-green-600">
            <span>+12%</span>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={mockData.contracts.monthly}>
            <defs>
              <linearGradient id="contractsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="month" className="text-sm" />
            <YAxis className="text-sm" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb', 
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#6366f1"
              strokeWidth={2}
              fill="url(#contractsGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Sözleşme Durumları */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sözleşme Durumları</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={mockData.contracts.status}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
            >
              {mockData.contracts.status.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Gelir Trendi */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Gelir Trendi</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={mockData.contracts.trends}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="date" className="text-sm" />
            <YAxis className="text-sm" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb', 
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(value: number) => [`₺${value.toLocaleString()}`, 'Gelir']}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#10b981"
              strokeWidth={3}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 6 }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Kullanıcı Aktivitesi */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Günlük Kullanıcı Aktivitesi</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={mockData.performance.userActivity}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="hour" className="text-sm" />
            <YAxis className="text-sm" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb', 
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Bar 
              dataKey="users" 
              fill="#8b5cf6"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Chart Selection Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1">
        <div className="flex space-x-1 overflow-x-auto">
          {chartOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setSelectedChart(option.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                selectedChart === option.id
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span>{option.icon}</span>
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chart Content */}
      {selectedChart === 'overview' && renderOverviewCharts()}
      
      {selectedChart === 'contracts' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sözleşme Değerleri</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockData.contracts.monthly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => `₺${value.toLocaleString()}`} />
                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Detaylı Durum Analizi</h3>
            <div className="space-y-4">
              {mockData.contracts.status.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-sm font-medium text-gray-700">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">{item.value}</div>
                    <div className="text-xs text-gray-500">%{((item.value / 100) * 100).toFixed(1)}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {selectedChart === 'performance' && (
        <div className="grid grid-cols-1 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sistem Yanıt Süresi</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockData.performance.responseTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip formatter={(value: number) => [`${value}ms`, 'Yanıt Süresi']} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ fill: '#f59e0b' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {selectedChart === 'trends' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Haftalık Trend Analizi</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={mockData.contracts.trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="contracts"
                stroke="#6366f1"
                strokeWidth={2}
                name="Sözleşme Sayısı"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={2}
                name="Gelir (₺)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
} 