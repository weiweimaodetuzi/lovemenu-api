// 简单测试API
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
      message: 'API测试成功',
      timestamp: new Date().toISOString(),
      method: req.method
    })
  } catch (error) {
    console.error('测试API错误:', error)
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    })
  }
}
