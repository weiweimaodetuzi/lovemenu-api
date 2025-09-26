// 家庭组管理API - Supabase版本
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const { method, body, query } = req

  try {
    switch (method) {
      case 'GET':
        return await getFamilyGroup(req, res)
      case 'POST':
        return await createOrJoinFamilyGroup(req, res)
      case 'PUT':
        return await updateFamilyGroup(req, res)
      case 'DELETE':
        return await removeMember(req, res)
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
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

// 生成邀请码
function generateInviteCode() {
  return Math.random().toString(36).substr(2, 8).toUpperCase()
}

// 获取家庭组信息
async function getFamilyGroup(req, res) {
  try {
    const { familyGroupId, action } = req.query

    if (!familyGroupId) {
      return res.status(400).json({ 
        success: false, 
        error: '缺少家庭组ID' 
      })
    }

    const { data, error } = await supabase
      .from('family_groups')
      .select('*')
      .eq('id', familyGroupId)
      .single()

    if (error) throw error

    if (!data) {
      return res.status(404).json({ 
        success: false, 
        error: '家庭组不存在' 
      })
    }

    const familyGroup = {
      id: data.id,
      _id: data.id,
      name: data.name,
      inviteCode: data.invite_code,
      createUserId: data.create_user_id,
      members: data.members || [],
      createTime: data.created_at,
      updateTime: data.updated_at
    }

    if (action === 'members') {
      return res.status(200).json({ 
        success: true, 
        members: familyGroup.members,
        message: '获取成员列表成功' 
      })
    } else {
      return res.status(200).json({ 
        success: true, 
        groupInfo: familyGroup,
        message: '获取家庭组信息成功' 
      })
    }
  } catch (error) {
    console.error('获取家庭组信息失败:', error)
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    })
  }
}

// 创建或加入家庭组
async function createOrJoinFamilyGroup(req, res) {
  try {
    const { action, groupName, inviteCode, userId, userInfo } = req.body

    if (action === 'create') {
      // 创建家庭组
      if (!groupName || !userId) {
        return res.status(400).json({ 
          success: false, 
          error: '缺少必填字段' 
        })
      }

      const inviteCodeValue = generateInviteCode()
      const members = [{
        userId: userId,
        nickName: userInfo.nickName || '用户',
        avatarUrl: userInfo.avatarUrl || '',
        joinTime: new Date().toISOString(),
        isAdmin: true
      }]

      const { data, error } = await supabase
        .from('family_groups')
        .insert([{
          name: groupName,
          invite_code: inviteCodeValue,
          create_user_id: userId,
          members: members
        }])
        .select()
        .single()

      if (error) throw error

      const familyGroup = {
        id: data.id,
        _id: data.id,
        name: data.name,
        inviteCode: data.invite_code,
        createUserId: data.create_user_id,
        members: data.members,
        createTime: data.created_at,
        updateTime: data.updated_at
      }

      // 更新用户的家庭组ID
      await supabase
        .from('users')
        .update({ family_group_id: data.id })
        .eq('id', userId)

      return res.status(200).json({ 
        success: true, 
        familyGroupId: data.id,
        inviteCode: inviteCodeValue,
        groupInfo: familyGroup,
        message: '家庭组创建成功' 
      })
    } else if (action === 'join') {
      // 加入家庭组
      if (!inviteCode || !userId) {
        return res.status(400).json({ 
          success: false, 
          error: '缺少必填字段' 
        })
      }

      // 查找家庭组
      const { data: familyGroup, error: findError } = await supabase
        .from('family_groups')
        .select('*')
        .eq('invite_code', inviteCode)
        .single()

      if (findError) throw findError

      if (!familyGroup) {
        return res.status(404).json({ 
          success: false, 
          error: '邀请码无效' 
        })
      }

      // 检查是否已经是成员
      const members = familyGroup.members || []
      const isMember = members.some(member => member.userId === userId)
      if (isMember) {
        return res.status(400).json({ 
          success: false, 
          error: '您已经是该家庭组的成员' 
        })
      }

      // 添加新成员
      const newMember = {
        userId: userId,
        nickName: userInfo.nickName || '用户',
        avatarUrl: userInfo.avatarUrl || '',
        joinTime: new Date().toISOString(),
        isAdmin: false
      }

      const updatedMembers = [...members, newMember]

      const { data: updatedGroup, error: updateError } = await supabase
        .from('family_groups')
        .update({ members: updatedMembers })
        .eq('id', familyGroup.id)
        .select()
        .single()

      if (updateError) throw updateError

      // 更新用户的家庭组ID
      await supabase
        .from('users')
        .update({ family_group_id: familyGroup.id })
        .eq('id', userId)

      const result = {
        id: updatedGroup.id,
        _id: updatedGroup.id,
        name: updatedGroup.name,
        inviteCode: updatedGroup.invite_code,
        createUserId: updatedGroup.create_user_id,
        members: updatedGroup.members,
        createTime: updatedGroup.created_at,
        updateTime: updatedGroup.updated_at
      }

      return res.status(200).json({ 
        success: true, 
        familyGroupId: familyGroup.id,
        groupInfo: result,
        message: '加入家庭组成功' 
      })
    } else {
      return res.status(400).json({ 
        success: false, 
        error: '无效的操作类型' 
      })
    }
  } catch (error) {
    console.error('家庭组操作失败:', error)
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    })
  }
}

// 更新家庭组信息
async function updateFamilyGroup(req, res) {
  try {
    const { familyGroupId, name } = req.body

    if (!familyGroupId) {
      return res.status(400).json({ 
        success: false, 
        error: '缺少家庭组ID' 
      })
    }

    const updateData = {}
    if (name) updateData.name = name

    const { data, error } = await supabase
      .from('family_groups')
      .update(updateData)
      .eq('id', familyGroupId)
      .select()
      .single()

    if (error) throw error

    if (!data) {
      return res.status(404).json({ 
        success: false, 
        error: '家庭组不存在' 
      })
    }

    const familyGroup = {
      id: data.id,
      _id: data.id,
      name: data.name,
      inviteCode: data.invite_code,
      createUserId: data.create_user_id,
      members: data.members || [],
      createTime: data.created_at,
      updateTime: data.updated_at
    }

    return res.status(200).json({ 
      success: true, 
      groupInfo: familyGroup,
      message: '家庭组信息更新成功' 
    })
  } catch (error) {
    console.error('更新家庭组信息失败:', error)
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    })
  }
}

// 移除家庭成员
async function removeMember(req, res) {
  try {
    const { familyGroupId, memberId, operatorId } = req.body

    if (!familyGroupId || !memberId || !operatorId) {
      return res.status(400).json({ 
        success: false, 
        error: '缺少必填字段' 
      })
    }

    // 获取家庭组信息
    const { data: familyGroup, error: getError } = await supabase
      .from('family_groups')
      .select('*')
      .eq('id', familyGroupId)
      .single()

    if (getError) throw getError

    if (!familyGroup) {
      return res.status(404).json({ 
        success: false, 
        error: '家庭组不存在' 
      })
    }

    // 检查操作权限
    const members = familyGroup.members || []
    const operator = members.find(member => member.userId === operatorId)
    if (!operator || !operator.isAdmin) {
      return res.status(403).json({ 
        success: false, 
        error: '只有管理员可以移除成员' 
      })
    }

    // 移除成员
    const updatedMembers = members.filter(member => member.userId !== memberId)

    const { error: updateError } = await supabase
      .from('family_groups')
      .update({ members: updatedMembers })
      .eq('id', familyGroupId)

    if (updateError) throw updateError

    return res.status(200).json({ 
      success: true, 
      message: '成员移除成功' 
    })
  } catch (error) {
    console.error('移除家庭成员失败:', error)
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    })
  }
}
