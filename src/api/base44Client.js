import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const db = {
  auth: {
    isAuthenticated: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      return !!session
    },
    me: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      return user
    },
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
    }
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