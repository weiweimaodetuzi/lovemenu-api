// 主入口文件
module.exports = async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    return res.status(200).json({ 
      success: true, 
      message: '家庭点菜API服务运行中',
      timestamp: new Date().toISOString(),
      endpoints: [
        '/dishes - 菜品管理',
        '/users - 用户管理', 
        '/family-groups - 家庭组管理',
        '/test - 测试接口'
      ]
    })
  } catch (error) {
    console.error('API错误:', error)
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    })
  }
}
