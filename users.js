// 用户认证API - Supabase版本
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const { method, body } = req

  try {
    switch (method) {
      case 'POST':
        return await loginOrRegister(req, res)
      case 'PUT':
        return await updateUser(req, res)
      default:
        res.setHeader('Allow', ['POST', 'PUT'])
        return res.status(405).json({ 
          success: false, 
          error: `方法 ${method} 不被允许` 
        })
    }
  } catch (error) {
    console.error('API错误:', error)
    return res.status(500).json({ 
      success: false, 
      error: error.message || '服务器内部错误' 
    })
  }
}

// 用户登录或注册
async function loginOrRegister(req, res) {
  try {
    const { openid, nickName, avatarUrl } = req.body

    if (!openid) {
      return res.status(400).json({ 
        success: false, 
        error: '缺少openid' 
      })
    }

    // 查找现有用户
    let user
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('openid', openid)
      .single()

    if (findError && findError.code !== 'PGRST116') {
      throw findError
    }

    if (existingUser) {
      // 用户存在
      user = {
        id: existingUser.id,
        _id: existingUser.id,
        openid: existingUser.openid,
        nickName: existingUser.nick_name,
        avatarUrl: existingUser.avatar_url,
        familyGroupId: existingUser.family_group_id,
        createTime: existingUser.created_at,
        updateTime: existingUser.updated_at
      }
    } else {
      // 用户不存在，创建新用户
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([{
          openid,
          nick_name: nickName || '用户' + Date.now().toString().substr(-4),
          avatar_url: avatarUrl || '',
          family_group_id: null
        }])
        .select()
        .single()

      if (createError) throw createError

      user = {
        id: newUser.id,
        _id: newUser.id,
        openid: newUser.openid,
        nickName: newUser.nick_name,
        avatarUrl: newUser.avatar_url,
        familyGroupId: newUser.family_group_id,
        createTime: newUser.created_at,
        updateTime: newUser.updated_at
      }
    }

    return res.status(200).json({ 
      success: true, 
      userInfo: user,
      familyGroupId: user.familyGroupId,
      message: '登录成功' 
    })
  } catch (error) {
    console.error('登录失败:', error)
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    })
  }
}

// 更新用户信息
async function updateUser(req, res) {
  try {
    const { userId, nickName, avatarUrl } = req.body

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: '缺少用户ID' 
      })
    }

    const updateData = {}
    if (nickName) updateData.nick_name = nickName
    if (avatarUrl) updateData.avatar_url = avatarUrl

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error

    if (!data) {
      return res.status(404).json({ 
        success: false, 
        error: '用户不存在' 
      })
    }

    const user = {
      id: data.id,
      _id: data.id,
      openid: data.openid,
      nickName: data.nick_name,
      avatarUrl: data.avatar_url,
      familyGroupId: data.family_group_id,
      createTime: data.created_at,
      updateTime: data.updated_at
    }

    return res.status(200).json({ 
      success: true, 
      userInfo: user,
      message: '用户信息更新成功' 
    })
  } catch (error) {
    console.error('更新用户信息失败:', error)
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    })
  }
}
