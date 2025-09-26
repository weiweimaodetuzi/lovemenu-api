// 菜品管理API - Supabase版本
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

module.exports = async function handler(req, res) {
  try {
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    if (req.method === 'OPTIONS') {
      return res.status(200).end()
    }

    // 检查环境变量
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables')
      return res.status(500).json({ 
        success: false, 
        error: 'Server configuration error' 
      })
    }

  const { method, body, query } = req

  try {
    switch (method) {
      case 'GET':
        return await getDishes(req, res)
      case 'POST':
        return await addDish(req, res)
      case 'PUT':
        return await updateDish(req, res)
      case 'DELETE':
        return await deleteDish(req, res)
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

// 获取菜品列表
async function getDishes(req, res) {
  try {
    const { familyGroupId } = req.query
    
    if (!familyGroupId) {
      return res.status(400).json({ 
        success: false, 
        error: '缺少家庭组ID' 
      })
    }

    const { data, error } = await supabase
      .from('dishes')
      .select('*')
      .eq('family_group_id', familyGroupId)
      .order('created_at', { ascending: false })

    if (error) throw error

    const dishes = data.map(dish => ({
      id: dish.id,
      _id: dish.id,
      name: dish.name,
      description: dish.description,
      category: dish.category,
      image: dish.image_url,
      ingredients: dish.ingredients || [],
      familyGroupId: dish.family_group_id,
      createUserId: dish.create_user_id,
      createTime: dish.created_at,
      updateTime: dish.updated_at
    }))

    return res.status(200).json({ 
      success: true, 
      dishes,
      message: '获取菜品列表成功' 
    })
  } catch (error) {
    console.error('获取菜品列表失败:', error)
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    })
  }
}

// 添加菜品
async function addDish(req, res) {
  try {
    const { 
      name, 
      description, 
      category, 
      image, 
      ingredients, 
      familyGroupId, 
      createUserId 
    } = req.body

    // 验证必填字段
    if (!name || !category || !familyGroupId || !createUserId) {
      return res.status(400).json({ 
        success: false, 
        error: '缺少必填字段' 
      })
    }

    const { data, error } = await supabase
      .from('dishes')
      .insert([{
        name,
        description: description || '',
        category,
        image_url: image || '',
        ingredients: ingredients || [],
        family_group_id: familyGroupId,
        create_user_id: createUserId
      }])
      .select()

    if (error) throw error

    const dish = {
      id: data[0].id,
      _id: data[0].id,
      name: data[0].name,
      description: data[0].description,
      category: data[0].category,
      image: data[0].image_url,
      ingredients: data[0].ingredients || [],
      familyGroupId: data[0].family_group_id,
      createUserId: data[0].create_user_id,
      createTime: data[0].created_at,
      updateTime: data[0].updated_at
    }

    return res.status(200).json({ 
      success: true, 
      dish,
      dishId: data[0].id,
      message: '菜品添加成功' 
    })
  } catch (error) {
    console.error('添加菜品失败:', error)
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    })
  }
}

// 更新菜品
async function updateDish(req, res) {
  try {
    const { dishId, dishData } = req.body

    if (!dishId) {
      return res.status(400).json({ 
        success: false, 
        error: '缺少菜品ID' 
      })
    }

    const updateData = {}
    if (dishData.name) updateData.name = dishData.name
    if (dishData.description !== undefined) updateData.description = dishData.description
    if (dishData.category) updateData.category = dishData.category
    if (dishData.image !== undefined) updateData.image_url = dishData.image
    if (dishData.ingredients) updateData.ingredients = dishData.ingredients

    const { data, error } = await supabase
      .from('dishes')
      .update(updateData)
      .eq('id', dishId)
      .select()

    if (error) throw error

    if (data.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: '菜品不存在' 
      })
    }

    const dish = {
      id: data[0].id,
      _id: data[0].id,
      name: data[0].name,
      description: data[0].description,
      category: data[0].category,
      image: data[0].image_url,
      ingredients: data[0].ingredients || [],
      familyGroupId: data[0].family_group_id,
      createUserId: data[0].create_user_id,
      createTime: data[0].created_at,
      updateTime: data[0].updated_at
    }

    return res.status(200).json({ 
      success: true, 
      dish,
      message: '菜品更新成功' 
    })
  } catch (error) {
    console.error('更新菜品失败:', error)
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    })
  }
}

// 删除菜品
async function deleteDish(req, res) {
  try {
    const { dishId } = req.query

    if (!dishId) {
      return res.status(400).json({ 
        success: false, 
        error: '缺少菜品ID' 
      })
    }

    const { error } = await supabase
      .from('dishes')
      .delete()
      .eq('id', dishId)

    if (error) throw error

    return res.status(200).json({ 
      success: true, 
      message: '菜品删除成功' 
    })
  } catch (error) {
    console.error('删除菜品失败:', error)
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    })
  }
  } catch (error) {
    console.error('API处理错误:', error)
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    })
  }
}
