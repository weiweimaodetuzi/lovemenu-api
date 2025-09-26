# 家庭点菜小程序 API - Vercel + Supabase

## 🎯 项目概述

这是家庭点菜小程序的后端API，使用Vercel + Supabase构建，完全免费且无时间限制，**在中国可以正常访问**。

## 📋 功能特性

- ✅ **用户认证**：微信登录和用户管理
- ✅ **家庭组管理**：创建、加入、管理家庭组
- ✅ **菜品管理**：增删改查菜品信息
- ✅ **数据同步**：支持多设备实时同步
- ✅ **完全免费**：无时间限制，无存储限制
- ✅ **中国可访问**：Supabase在中国可以正常使用

## 🚀 部署步骤

### 1. 创建 Supabase 数据库

1. 访问 [supabase.com](https://supabase.com)
2. 注册账号并登录
3. 创建新项目（选择新加坡区域）
4. 获取项目URL和API密钥

### 2. 初始化 Supabase 数据库

在 Supabase 控制台的 SQL 编辑器中运行以下脚本：

```sql
-- 1. 创建用户表
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  openid TEXT UNIQUE NOT NULL,
  nick_name TEXT,
  avatar_url TEXT,
  family_group_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建家庭组表
CREATE TABLE family_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  create_user_id UUID REFERENCES users(id),
  members JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 创建菜品表
CREATE TABLE dishes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  image_url TEXT,
  ingredients JSONB DEFAULT '[]'::jsonb,
  family_group_id UUID REFERENCES family_groups(id),
  create_user_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 创建采购车表
CREATE TABLE cart_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dish_id UUID REFERENCES dishes(id),
  user_id UUID REFERENCES users(id),
  add_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(dish_id, user_id)
);

-- 5. 创建索引
CREATE INDEX idx_users_openid ON users(openid);
CREATE INDEX idx_family_groups_invite_code ON family_groups(invite_code);
CREATE INDEX idx_dishes_family_group ON dishes(family_group_id);
CREATE INDEX idx_dishes_user ON dishes(create_user_id);
CREATE INDEX idx_cart_items_user ON cart_items(user_id);
```

### 3. 部署到 Vercel

1. 访问 [vercel.com](https://vercel.com)
2. 使用 GitHub 登录
3. 导入此项目
4. 配置环境变量：
   - `SUPABASE_URL`: 您的 Supabase 项目URL
   - `SUPABASE_ANON_KEY`: 您的 Supabase anon key
5. 部署项目

### 4. 获取 API 地址

部署完成后，您会得到一个类似这样的 API 地址：
```
https://your-project-name.vercel.app
```

## 📚 API 接口文档

### 用户认证

#### 登录/注册
```
POST /api/users
Content-Type: application/json

{
  "openid": "微信openid",
  "nickName": "用户昵称",
  "avatarUrl": "头像URL"
}
```

#### 更新用户信息
```
PUT /api/users
Content-Type: application/json

{
  "userId": "用户ID",
  "nickName": "新昵称",
  "avatarUrl": "新头像URL"
}
```

### 家庭组管理

#### 创建家庭组
```
POST /api/family-groups
Content-Type: application/json

{
  "action": "create",
  "groupName": "家庭组名称",
  "userId": "用户ID",
  "userInfo": {
    "nickName": "用户昵称",
    "avatarUrl": "头像URL"
  }
}
```

#### 加入家庭组
```
POST /api/family-groups
Content-Type: application/json

{
  "action": "join",
  "inviteCode": "邀请码",
  "userId": "用户ID",
  "userInfo": {
    "nickName": "用户昵称",
    "avatarUrl": "头像URL"
  }
}
```

#### 获取家庭组信息
```
GET /api/family-groups?familyGroupId=家庭组ID
```

#### 获取成员列表
```
GET /api/family-groups?familyGroupId=家庭组ID&action=members
```

### 菜品管理

#### 获取菜品列表
```
GET /api/dishes?familyGroupId=家庭组ID
```

#### 添加菜品
```
POST /api/dishes
Content-Type: application/json

{
  "name": "菜品名称",
  "description": "菜品描述",
  "category": "菜品分类",
  "image": "图片URL",
  "ingredients": ["原料1", "原料2"],
  "familyGroupId": "家庭组ID",
  "createUserId": "用户ID"
}
```

#### 更新菜品
```
PUT /api/dishes
Content-Type: application/json

{
  "dishId": "菜品ID",
  "dishData": {
    "name": "新名称",
    "description": "新描述"
  }
}
```

#### 删除菜品
```
DELETE /api/dishes?dishId=菜品ID
```

## 🔧 环境变量

| 变量名 | 描述 | 示例 |
|--------|------|------|
| `SUPABASE_URL` | Supabase 项目URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase 匿名密钥 | `eyJ...` |

## 💰 费用说明

- **Vercel**: 永久免费（100GB 带宽/月）
- **Supabase**: 永久免费（500MB 存储）
- **总计**: 完全免费，无时间限制

## 🐛 故障排除

### 常见问题

1. **CORS 错误**
   - 确保 API 返回了正确的 CORS 头
   - 检查请求域名是否在白名单中

2. **Supabase 连接失败**
   - 检查 API 密钥是否正确
   - 确认数据库和表已创建

3. **数据同步问题**
   - 检查网络连接
   - 查看控制台错误信息

### 调试技巧

1. 查看 Vercel 函数日志
2. 检查 Supabase 查询日志
3. 使用 Postman 测试 API

## 📞 技术支持

如有问题，请检查：
1. 环境变量配置
2. Supabase 数据库和表
3. API 请求格式
4. 网络连接状态

---

**注意**: 此 API 专为家庭点菜小程序设计，请勿用于商业用途。
