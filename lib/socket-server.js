import { Server as SocketIOServer } from 'socket.io'

const userColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
]

let colorIndex = 0

export function initializeSocketIO(server) {
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? process.env.NEXTAUTH_URL 
        : 'http://localhost:3000',
      methods: ['GET', 'POST']
    }
  })

  // Contract room içindeki aktif kullanıcıları takip et
  const contractUsers = new Map()
  // Contract içeriğini takip et
  const contractContent = new Map()

  io.on('connection', (socket) => {
    console.log('🔌 User connected:', socket.id)

    // Contract odasına katıl
    socket.on('join-contract', (data) => {
      const { contractId, user } = data
      
      // Kullanıcıya renk ata
      const collaborationUser = {
        ...user,
        color: userColors[colorIndex % userColors.length]
      }
      colorIndex++

      // Socket'i contract odasına ekle
      socket.join(contractId)

      // Kullanıcıyı contract kullanıcıları listesine ekle
      if (!contractUsers.has(contractId)) {
        contractUsers.set(contractId, new Map())
      }
      contractUsers.get(contractId).set(socket.id, collaborationUser)

      // Odadaki diğer kullanıcılara yeni kullanıcıyı bildir
      socket.to(contractId).emit('user-joined', collaborationUser)

      // Yeni kullanıcıya mevcut kullanıcıları gönder
      const currentUsers = Array.from(contractUsers.get(contractId).values())
        .filter(u => u.id !== user.id)
      socket.emit('current-users', currentUsers)

      // Mevcut contract içeriğini gönder
      if (contractContent.has(contractId)) {
        socket.emit('contract-content', contractContent.get(contractId))
      }

      console.log(`👥 User ${user.name} joined contract ${contractId}`)
    })

    // Contract içeriği değişikliği
    socket.on('content-change', (data) => {
      const { contractId } = data
      
      // İçeriği güncelle
      contractContent.set(contractId, data.changes[0]?.text || '')
      
      // Diğer kullanıcılara değişikliği yayınla
      socket.to(contractId).emit('content-changed', data)
      
      console.log(`📝 Content changed in contract ${contractId} by user ${data.userId}`)
    })

    // Cursor pozisyonu değişikliği
    socket.on('cursor-change', (data) => {
      const { contractId, userId, cursor } = data
      
      // Kullanıcının cursor pozisyonunu güncelle
      const contractUserMap = contractUsers.get(contractId)
      if (contractUserMap) {
        for (const [socketId, user] of contractUserMap) {
          if (user.id === userId) {
            user.cursor = cursor
            break
          }
        }
      }
      
      // Diğer kullanıcılara cursor pozisyonunu yayınla
      socket.to(contractId).emit('cursor-moved', { userId, cursor })
    })

    // Contract odasından ayrıl
    socket.on('leave-contract', (contractId) => {
      socket.leave(contractId)
      
      // Kullanıcıyı listeden çıkar
      const contractUserMap = contractUsers.get(contractId)
      if (contractUserMap) {
        const user = contractUserMap.get(socket.id)
        contractUserMap.delete(socket.id)
        
        // Diğer kullanıcılara ayrılan kullanıcıyı bildir
        if (user) {
          socket.to(contractId).emit('user-left', user.id)
        }
        
        // Eğer odada kimse kalmadıysa temizle
        if (contractUserMap.size === 0) {
          contractUsers.delete(contractId)
          contractContent.delete(contractId)
        }
      }
      
      console.log(`👋 User left contract ${contractId}`)
    })

    // Bağlantı koptuğunda
    socket.on('disconnect', () => {
      console.log('🔕 User disconnected:', socket.id)
      
      // Kullanıcıyı tüm contract odalarından çıkar
      for (const [contractId, userMap] of contractUsers) {
        if (userMap.has(socket.id)) {
          const user = userMap.get(socket.id)
          userMap.delete(socket.id)
          
          if (user) {
            socket.to(contractId).emit('user-left', user.id)
          }
          
          // Eğer odada kimse kalmadıysa temizle
          if (userMap.size === 0) {
            contractUsers.delete(contractId)
            contractContent.delete(contractId)
          }
        }
      }
    })
  })

  return io
} 