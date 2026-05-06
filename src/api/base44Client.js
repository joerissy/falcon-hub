import { createClient } from '@supabase/supabase-js'

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const supabaseUrl = rawSupabaseUrl?.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  if (!user) return null
  return {
    ...user,
    ...user.user_metadata,
  }
}

export const db = {
  auth: {
    isAuthenticated: async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      return !!session
    },
    me: getCurrentUser,
    signIn: async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      return data
    },
    signUp: async (email, password) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      if (error) throw error
      return data
    },
    signOut: async () => {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    },
    updateMe: async (updates) => {
      const { data, error } = await supabase.auth.updateUser({ data: updates })
      if (error) throw error
      return data
    },
    logout: async (redirectUrl) => {
      await supabase.auth.signOut()
      if (redirectUrl && typeof window !== 'undefined') {
        window.location.href = redirectUrl
      }
    },
    redirectToLogin: (redirectUrl) => {
      if (typeof window !== 'undefined') {
        window.location.href = redirectUrl || '/'
      }
    },
  },
  agents: {
    listConversations: async ({ agent_name } = {}) => {
      try {
        const query = supabase.from('conversations').select('*')
        if (agent_name) query.eq('agent_name', agent_name)
        const { data, error } = await query.order('updated_date', { ascending: false })
        if (error) throw error
        return data || []
      } catch (error) {
        console.warn('Unable to list conversations:', error)
        return []
      }
    },
    createConversation: async ({ agent_name, metadata }) => {
      const { data, error } = await supabase
        .from('conversations')
        .insert({ agent_name, metadata, created_date: new Date().toISOString(), updated_date: new Date().toISOString() })
        .select()
        .single()
      if (error) throw error
      return data
    },
    getConversation: async (id) => {
      try {
        const { data, error } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', id)
          .single()
        if (error) throw error
        return data
      } catch (error) {
        console.warn('Unable to get conversation:', error)
        return null
      }
    },
    addMessage: async (conv, message) => {
      const conversationId = typeof conv === 'object' ? conv.id : conv
      const { data, error } = await supabase
        .from('conversation_messages')
        .insert({ conversation_id: conversationId, ...message, created_at: new Date().toISOString() })
        .select()
        .single()
      if (error) throw error
      await supabase
        .from('conversations')
        .update({ updated_date: new Date().toISOString() })
        .eq('id', conversationId)
      return data
    },
    subscribeToConversation: (conversationId, callback) => {
      let active = true
      const fetchMessages = async () => {
        if (!active) return
        try {
          const { data, error } = await supabase
            .from('conversation_messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true })
          if (!error) {
            callback({ messages: data || [] })
          }
        } catch (error) {
          console.warn('Unable to subscribe to conversation:', error)
        }
      }
      const interval = setInterval(fetchMessages, 3000)
      fetchMessages()
      return () => {
        active = false
        clearInterval(interval)
      }
    },
  },
  entities: new Proxy({}, {
    get: (target, tableName) => ({
      filter: async (filters = {}) => {
        let query = supabase.from(tableName).select('*')
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value)
        })
        const { data, error } = await query
        if (error) throw error
        return data
      },
      get: async (id) => {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .eq('id', id)
          .single()
        if (error) throw error
        return data
      },
      create: async (item) => {
        const { data, error } = await supabase
          .from(tableName)
          .insert(item)
          .select()
          .single()
        if (error) throw error
        return data
      },
      update: async (id, updates) => {
        const { data, error } = await supabase
          .from(tableName)
          .update(updates)
          .eq('id', id)
          .select()
          .single()
        if (error) throw error
        return data
      },
      delete: async (id) => {
        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq('id', id)
        if (error) throw error
        return true
      }
    })
  }),
  integrations: {
    Core: {
      UploadFile: async (file) => {
        const fileName = `${Date.now()}-${file.name}`
        const { data, error } = await supabase.storage
          .from('uploads')
          .upload(fileName, file)
        if (error) throw error
        const { data: { publicUrl } } = supabase.storage
          .from('uploads')
          .getPublicUrl(fileName)
        return { file_url: publicUrl }
      }
    }
  }
}

export const base44 = db
export default db

globalThis.__B44_DB__ = db